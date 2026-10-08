import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { rateLimit, safeErrorResponse } from '../../shared/security.ts';
import { withLimitRetry } from '../../shared/retryLimit.ts';
import { notifyUser } from '../../shared/notifyUser.ts';
import { notifyAdmins } from '../../shared/adminNotify.ts';
import {
  AGENCY_RULES, AGENCY_COMMISSION_PER_200K, agencyCommissionFor, generateAgencyCode, ensureQuotaTiers,
  syncQuotaRewards, refreshAgencyTotals, agencyStats, sendDirect, inviteMarker, inviteRefId, periodKey, todayKey,
  ASSISTANT_LIMIT, ASSISTANT_SHARES, assistantInviteExpiry, assistantInviteText, activeAssistant, expireAssistantInvites,
  ownedAgencyPatch, clearOwnedAgencyPatch, detachAssistant,
} from '../../shared/agency.ts';

/**
 * Yayıncı & ajans servisi: ajans oluşturma, yayıncı davetleri, kota kazançları,
 * ajans komisyonu, ajans değişikliği (transfer) ve admin işlemleri.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Oturum gerekli' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const isAdmin = user.role === 'admin';
    const account = await base44.asServiceRole.entities.User.get(user.id).catch(() => null);
    if (!account) return Response.json({ error: 'Hesap bulunamadı' }, { status: 404 });
    const displayName = account.username || account.full_name || 'Kullanıcı';

    const userPatch = (agency: any) => ({
      agency_code: agency.agency_id, agency_record_id: agency.id, agency_name: agency.name,
      agency_owner_id: agency.owner_id, agency_role: agency.owner_id === account.id ? 'owner' : 'broadcaster',
      broadcaster_status: agency.owner_id === account.id ? '' : 'active',
    });

    const findAgencyByCode = async (code: string) => {
      const rows = await base44.asServiceRole.entities.Agency.filter({ agency_id: code }, '-created_date', 1).catch(() => []);
      return rows?.[0] || null;
    };

    const findUserByMemberId = async (memberId: any) => {
      const value = String(memberId || '').trim().replace('#', '');
      if (!value) return null;
      const rows = await base44.asServiceRole.entities.User.filter({ member_id: value }, '-created_date', 2).catch(() => []);
      return rows?.[0] || null;
    };

    // Yayıncı daveti yalnızca kabul edilmiş arkadaşlığı olan kullanıcılara gönderilir.
    const isFriendOf = async (userId: string, targetId: string) => {
      const rows = await base44.asServiceRole.entities.Friendship.filter({ members: userId }, '-created_date', 200).catch(() => []);
      return (rows || []).some((row) => row.status === 'accepted' && (row.members || []).includes(targetId));
    };

    // Yan hesabı doğrulanıp yayıncılığı iptal edilen kişiye tekrar davet gönderilemez.
    const isDuplicateAccount = async (_userId: string) => false;

    // Başvuru aşamasındaki (onaylanmamış) ajanslarla işlem yapılamaz.
    const isAgencyActive = (agency: any) => !!agency && agency.status !== 'pending' && agency.status !== 'rejected' && agency.active !== false;

    // Ajans adı, üyelerin ve ajans sahibinin profil kayıtlarına yansıtılır.
    const syncAgencyName = async (agencyId: string, name: string) => {
      // Kullanıcı kayıtları toplu güncellenemez: tek tek yazılır, yoğunluk hatasında tekrar denenir.
      const [members, owners] = await Promise.all([
        base44.asServiceRole.entities.User.filter({ agency_record_id: agencyId }, '-created_date', 500).catch(() => []),
        base44.asServiceRole.entities.User.filter({ owned_agency_id: agencyId }, '-created_date', 20).catch(() => []),
      ]);
      for (const member of members || []) {
        await withLimitRetry(() => base44.asServiceRole.entities.User.update(member.id, { agency_name: name })).catch(() => {});
      }
      for (const owner of owners || []) {
        await withLimitRetry(() => base44.asServiceRole.entities.User.update(owner.id, { owned_agency_name: name })).catch(() => {});
      }
    };

    /**
     * Sahip olunan ajans: yayıncı üyeliğinden (agency_record_id) bağımsız çözülür.
     * Eski kayıtlarda sahiplik yalnızca rol alanıyla işaretli olduğu için oradan da okunur.
     */
    const loadOwnedAgency = async () => {
      const id = account.owned_agency_id || (account.agency_role === 'owner' ? account.agency_record_id : '');
      if (!id) return null;
      const agency = await base44.asServiceRole.entities.Agency.get(id).catch(() => null);
      return agency && agency.owner_id === account.id ? agency : null;
    };

    // ——— ÖZET: profil bölümündeki dinamik menü için ———
    if (action === 'summary') {
      if (account.broadcaster_status === 'active' && account.agency_record_id) {
        await syncQuotaRewards(base44, account.id).catch(() => {});
      }
      const [agency, ownedRecord, invites, sent, transfers] = await Promise.all([
        account.agency_record_id ? base44.asServiceRole.entities.Agency.get(account.agency_record_id).catch(() => null) : null,
        account.owned_agency_id ? base44.asServiceRole.entities.Agency.get(account.owned_agency_id).catch(() => null) : null,
        base44.asServiceRole.entities.AgencyInvite.filter({ invitee_id: account.id, status: 'pending' }, '-created_date', 50).catch(() => []),
        base44.asServiceRole.entities.AgencyInvite.filter({ owner_id: account.id, status: 'pending' }, '-created_date', 100).catch(() => []),
        base44.asServiceRole.entities.AgencyTransfer.filter({ user_id: account.id }, '-created_date', 20).catch(() => []),
      ]);
      // Sahiplik üyelikten ayrıdır: kişi başka bir ajanda yayıncı olsa da kendi ajansının sahibidir.
      const owned = ownedRecord && ownedRecord.owner_id === account.id ? ownedRecord : null;
      // Ajans sahibi, kaydın kendisinden doğrulanır: eski kayıtlarda rol alanı yanlış kalabiliyor.
      const ownerByRecord = !!agency && agency.owner_id === account.id;
      const role = !agency ? (account.agency_role || '') : (ownerByRecord ? 'owner' : (account.agency_role || 'broadcaster'));
      const broadcasterStatus = ownerByRecord ? '' : (account.broadcaster_status || (agency ? 'active' : ''));
      if (agency && (account.agency_role !== role || account.broadcaster_status !== broadcasterStatus)) {
        await base44.asServiceRole.entities.User.update(account.id, { agency_role: role, broadcaster_status: broadcasterStatus }).catch(() => {});
      }
      return Response.json({
        profile: {
          agency_code: account.agency_code || '', agency_record_id: account.agency_record_id || '',
          agency_name: account.agency_name || '', agency_role: role, agency_owner_id: agency?.owner_id || account.agency_owner_id || '',
          broadcaster_status: broadcasterStatus, agency_status: agency?.status || (account.agency_record_id ? 'active' : ''),
          owned_agency_id: owned?.id || account.owned_agency_id || '',
          owned_agency_code: owned?.agency_id || account.owned_agency_code || '',
          owned_agency_name: owned?.name || account.owned_agency_name || '',
          owned_agency_status: owned?.status || account.owned_agency_status || '',
        },
        agency: agency ? { id: agency.id, name: agency.name, agency_id: agency.agency_id, logo: agency.logo || '', description: agency.description || '', member_count: agency.member_count || 0, total_earnings: agency.total_earnings || 0, owner_id: agency.owner_id || '', owner_name: agency.owner_name || '', status: agency.status || 'active' } : null,
        owned_agency: owned ? { id: owned.id, name: owned.name, agency_id: owned.agency_id, logo: owned.logo || '', description: owned.description || '', rules: owned.rules || AGENCY_RULES.join('\n'), member_count: owned.member_count || 0, total_earnings: owned.total_earnings || 0, owner_id: owned.owner_id || '', owner_name: owned.owner_name || '', commission_per_200k: Number(owned.commission_per_200k) || AGENCY_COMMISSION_PER_200K, status: owned.status || 'active' } : null,
        invites: invites || [],
        invites_sent: sent || [],
        transfer: (transfers || []).find((row) => row.status === 'pending') || (transfers || [])[0] || null,
        rules: AGENCY_RULES,
      });
    }

    // ——— AJANS BAŞVURUSU ———
    if (action === 'create') {
      const name = String(body.name || '').trim().slice(0, 60);
      if (name.length < 3) return Response.json({ error: 'Ajans adı en az 3 karakter olmalı.' }, { status: 400 });
      // Kişi başka bir ajanda yayıncı olsa da kendi ajansını kurabilir: hediye ve kota akışı
      // üye olduğu ilk ajanda kalır, kendi ajansı ayrı yürür.
      if (account.owned_agency_id && account.owned_agency_status !== 'rejected') {
        return Response.json({ error: 'Zaten bir ajansın var.' }, { status: 400 });
      }
      const rl = await rateLimit(base44, 'agency-create:' + account.id, account.id, 5, 60000);
      if (!rl.allowed) return Response.json({ error: 'Çok fazla deneme, biraz bekleyin.' }, { status: 429 });
      let agency: any = null;
      for (let attempt = 0; attempt < 5 && !agency; attempt += 1) {
        const code = generateAgencyCode();
        if (await findAgencyByCode(code)) continue;
        agency = await base44.asServiceRole.entities.Agency.create({
          agency_id: code, name, description: String(body.description || '').trim().slice(0, 400),
          logo: String(body.logo || ''), rules: AGENCY_RULES.join('\n'),
          owner_id: account.id, owner_name: displayName, owner_avatar: account.avatar || '',
          commission_per_200k: AGENCY_COMMISSION_PER_200K, member_count: 0, active: true, status: 'pending',
        }).catch(() => null);
      }
      if (!agency) return Response.json({ error: 'Ajans oluşturulamadı, tekrar deneyin.' }, { status: 500 });
      // Ajans başvurudan geçer: yönetici onayına kadar "başvuru onay bekliyor" durumunda kalır.
      const ownPatch: any = ownedAgencyPatch(agency, 'pending');
      // Ajanssız kullanıcıda üyelik de kendi ajansına bağlanır: davet, panel ve kota akışı aynen çalışır.
      // Başka bir ajanda yayıncı olan kişide üyelik dokunulmadan kalır; hediye ve kotası oraya işler.
      if (!account.agency_record_id) Object.assign(ownPatch, userPatch(agency));
      await base44.asServiceRole.entities.User.update(account.id, ownPatch);
      await notifyAdmins(base44, {
        event: 'agency_application', ref_id: `agency-application:${agency.id}`,
        title: '🏢 Yeni ajans başvurusu',
        body: `${displayName} "${name}" ajansı için başvurdu.`,
        link: '/admin/ajanslar',
      }).catch(() => {});
      await notifyUser(base44, {
        user_id: account.id, type: 'agency_applied', title: '🏢 Ajans başvurun alındı',
        body: `${name} (${agency.agency_id}) başvurun yönetici onayında. Onaylandığında ajans sahibi olur ve yayıncı davet edebilirsin.`,
        link: '/ajans',
      }).catch(() => {});
      return Response.json({ ok: true, agency });
    }

    // ——— AJANS AYARLARI ———
    if (action === 'update') {
      // Sahiplik yayıncı üyeliğinden bağımsız çözülür; ayarlar başvuru aşamasında da düzenlenebilir.
      const ownAgency = await loadOwnedAgency();
      if (!ownAgency) return Response.json({ error: 'Ajans sahibi değilsin.' }, { status: 403 });
      const patch: any = {};
      if (typeof body.name === 'string' && body.name.trim().length >= 3) patch.name = body.name.trim().slice(0, 60);
      if (typeof body.description === 'string') patch.description = body.description.trim().slice(0, 400);
      if (typeof body.logo === 'string') patch.logo = body.logo;
      if (typeof body.rules === 'string') patch.rules = body.rules.trim().slice(0, 2000);
      if (!Object.keys(patch).length) return Response.json({ error: 'Değişiklik yok.' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.Agency.update(ownAgency.id, patch);
      // Ajans adı üyelerin profiline yalnızca onaylanmış ajanslarda yansıtılır.
      if (patch.name && isAgencyActive({ ...ownAgency, ...patch })) await syncAgencyName(ownAgency.id, patch.name);
      return Response.json({ ok: true, agency: updated });
    }

    // ——— YAYINCI DAVETİ ———
    if (action === 'invite') {
      // Sahip kendi ajansına davet gönderir; asistan üye olduğu ajansa gönderir.
      const ownedAgency = await loadOwnedAgency();
      const inviteAgency = ownedAgency
        || (account.agency_record_id ? await base44.asServiceRole.entities.Agency.get(account.agency_record_id).catch(() => null) : null);
      // Asistan yalnızca aktif asistanlığı varsa davet gönderebilir; davet ettiği yayıncı kendi yayıncısı olur.
      const senderAssistant = !ownedAgency && account.agency_role === 'assistant' && inviteAgency ? activeAssistant(inviteAgency, account.id) : null;
      if (!inviteAgency || (!ownedAgency && !senderAssistant)) {
        return Response.json({ error: 'Yalnızca ajans sahibi ve asistanları davet gönderebilir.' }, { status: 403 });
      }
      const targetId = String(body.user_id || '');
      if (!targetId || targetId === account.id) return Response.json({ error: 'Geçersiz kullanıcı.' }, { status: 400 });
      const target = await base44.asServiceRole.entities.User.get(targetId).catch(() => null);
      if (!target) return Response.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
      if (target.agency_record_id) return Response.json({ error: 'Bu kullanıcı zaten bir ajansa bağlı.' }, { status: 400 });
      if (!(await isFriendOf(account.id, target.id))) return Response.json({ error: 'Yalnızca arkadaşlarını yayıncı olarak davet edebilirsin. Önce arkadaş ekle.' }, { status: 403 });
      if (await isDuplicateAccount(target.id)) return Response.json({ error: 'Bu hesabın yayıncılığı yan hesap nedeniyle iptal edildi; tekrar davet gönderilemez.' }, { status: 403 });
      const rl = await rateLimit(base44, 'agency-invite:' + account.id, account.id, 40, 60000);
      if (!rl.allowed) return Response.json({ error: 'Çok fazla davet gönderdin, biraz bekleyin.' }, { status: 429 });
      const existing = await base44.asServiceRole.entities.AgencyInvite
        .filter({ agency_record_id: inviteAgency.id, invitee_id: targetId, status: 'pending' }, '-created_date', 1).catch(() => []);
      if (existing?.length) return Response.json({ error: 'Bu kullanıcıya zaten davet gönderildi.' }, { status: 400 });
      const agency = inviteAgency;
      if (!agency) return Response.json({ error: 'Ajans bulunamadı.' }, { status: 404 });
      if (!isAgencyActive(agency)) return Response.json({ error: 'Ajansın onaylanmadan yayıncı davet edemezsin.' }, { status: 403 });
      const invite = await base44.asServiceRole.entities.AgencyInvite.create({
        kind: 'broadcaster',
        assistant_id: senderAssistant ? account.id : '', assistant_name: senderAssistant ? displayName : '',
        agency_record_id: agency.id, agency_code: agency.agency_id, agency_name: agency.name,
        agency_logo: agency.logo || '', agency_description: agency.description || '',
        agency_rules: agency.rules || AGENCY_RULES.join('\n'),
        owner_id: account.id, owner_name: displayName, owner_avatar: account.avatar || '',
        invitee_id: target.id, invitee_name: target.username || target.full_name || 'Kullanıcı', invitee_avatar: target.avatar || '',
        invitee_member_id: target.member_id || '',
        status: 'pending',
      });
      await sendDirect(base44, account, target, inviteMarker(invite.id)).catch(() => {});
      await notifyUser(base44, {
        user_id: target.id, type: 'agency_invite',
        title: '🎤 Yayıncı daveti', body: `${displayName} sizi ${agency.name} ajansına yayıncı olarak davet etti.`, link: '/arkadaslar',
        ref_id: inviteRefId(invite.id),
      }).catch(() => {});
      return Response.json({ ok: true, invite });
    }

    // ——— GELEN / GİDEN DAVETLER ———
    if (action === 'invites') {
      const [received, sent] = await Promise.all([
        base44.asServiceRole.entities.AgencyInvite.filter({ invitee_id: account.id }, '-created_date', 100).catch(() => []),
        base44.asServiceRole.entities.AgencyInvite.filter({ owner_id: account.id }, '-created_date', 200).catch(() => []),
      ]);
      return Response.json({ received: received || [], sent: sent || [] });
    }

    if (action === 'invite-detail') {
      const invite = await base44.asServiceRole.entities.AgencyInvite.get(String(body.invite_id || '')).catch(() => null);
      if (!invite) return Response.json({ error: 'Davet bulunamadı.' }, { status: 404 });
      if (invite.invitee_id !== account.id && invite.owner_id !== account.id && !isAdmin) return Response.json({ error: 'Yetkisiz.' }, { status: 403 });
      const agency = await base44.asServiceRole.entities.Agency.get(invite.agency_record_id).catch(() => null);
      return Response.json({ invite, agency, rules: invite.agency_rules || agency?.rules || AGENCY_RULES.join('\n') });
    }

    if (action === 'invite-respond') {
      const invite = await base44.asServiceRole.entities.AgencyInvite.get(String(body.invite_id || '')).catch(() => null);
      if (!invite || invite.invitee_id !== account.id) return Response.json({ error: 'Davet bulunamadı.' }, { status: 404 });
      if (invite.status !== 'pending') return Response.json({ error: 'Bu davet zaten yanıtlanmış.' }, { status: 400 });
      // Asistanlık daveti 7 gün sonra kendiliğinden geçersiz olur.
      if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
        await base44.asServiceRole.entities.AgencyInvite.update(invite.id, { status: 'expired', responded_at: new Date().toISOString() }).catch(() => {});
        return Response.json({ error: 'Bu davetin süresi doldu.' }, { status: 400 });
      }
      const invitedAgency = await base44.asServiceRole.entities.Agency.get(invite.agency_record_id).catch(() => null);
      const clearAssistantEntry = async (status: string) => {
        if (!invitedAgency) return;
        await base44.asServiceRole.entities.Agency.update(invitedAgency.id, {
          assistants: (invitedAgency.assistants || []).map((row: any) => (row.user_id === account.id ? { ...row, status } : row)),
        }).catch(() => {});
      };
      if (!body.accept) {
        await base44.asServiceRole.entities.AgencyInvite.update(invite.id, { status: 'rejected', responded_at: new Date().toISOString() });
        if (invite.kind === 'assistant') await clearAssistantEntry('removed');
        return Response.json({ ok: true, accepted: false });
      }
      // Asistanlık kabulü: kişi ajansa asistan olarak katılır, yayıncı rolü elinden alınmaz.
      if (invite.kind === 'assistant') {
        if (!invitedAgency) return Response.json({ error: 'Ajans bulunamadı.' }, { status: 404 });
        // Asistan aynı zamanda ajansın yayıncısı olarak kalır: yayıncı etiketi ve kota kazancı korunur.
        await base44.asServiceRole.entities.User.update(account.id, {
          agency_code: invitedAgency.agency_id, agency_record_id: invitedAgency.id, agency_name: invitedAgency.name,
          agency_owner_id: invitedAgency.owner_id, agency_role: 'assistant',
          broadcaster_status: 'active',
        });
        await base44.asServiceRole.entities.AgencyInvite.update(invite.id, { status: 'accepted', responded_at: new Date().toISOString() });
        await base44.asServiceRole.entities.Agency.update(invitedAgency.id, {
          assistants: (invitedAgency.assistants || []).map((row: any) => (row.user_id === account.id ? { ...row, status: 'active', accepted_at: new Date().toISOString() } : row)),
        }).catch(() => {});
        // Asistanın kendisine bilgi: profilindeki asistanlık etiketiyle birlikte görünür.
        await notifyUser(base44, {
          user_id: account.id, type: 'assistant_accepted', title: '🤝 Asistanlık onaylandı',
          body: `Artık ${invitedAgency.name} (${invitedAgency.agency_id}) ajansının asistanısınız • komisyon payı %${Number(invite.share) || 100}.`,
          link: '/profil',
        }).catch(() => {});
        const ownerAcc = await base44.asServiceRole.entities.User.get(invitedAgency.owner_id).catch(() => null);
        if (ownerAcc) {
          await sendDirect(base44, ownerAcc, account, `🤝 ${displayName} asistanlık davetini kabul etti ve ${invitedAgency.name} ajansının asistanı oldu.`).catch(() => {});
          await notifyUser(base44, {
            user_id: ownerAcc.id, type: 'assistant_joined', title: '🤝 Yeni asistan',
            body: `${displayName} ajansının asistanı oldu • payı %${Number(invite.share) || 100}.`, link: '/ajans/asistanlar',
          }).catch(() => {});
        }
        return Response.json({ ok: true, accepted: true, assistant: true, agency: { name: invitedAgency.name, agency_id: invitedAgency.agency_id, share: Number(invite.share) || 100 } });
      }
      const agency = invitedAgency;
      if (!agency) return Response.json({ error: 'Ajans bulunamadı.' }, { status: 404 });
      await base44.asServiceRole.entities.User.update(account.id, {
        agency_code: agency.agency_id, agency_record_id: agency.id, agency_name: agency.name,
        agency_owner_id: agency.owner_id, agency_role: 'broadcaster', broadcaster_status: 'active',
      });
      await base44.asServiceRole.entities.AgencyInvite.update(invite.id, { status: 'accepted', responded_at: new Date().toISOString() });
      await refreshAgencyTotals(base44, agency.id).catch(() => {});
      // Aynı kullanıcıya başka ajanslardan gelen bekleyen davetler kapanır.
      const others = await base44.asServiceRole.entities.AgencyInvite.filter({ invitee_id: account.id, status: 'pending' }, '-created_date', 50).catch(() => []);
      for (const row of (others || []).filter((item) => item.id !== invite.id)) {
        await base44.asServiceRole.entities.AgencyInvite.update(row.id, { status: 'cancelled', responded_at: new Date().toISOString() }).catch(() => {});
      }
      const owner = await base44.asServiceRole.entities.User.get(agency.owner_id).catch(() => null);
      if (owner) {
        await sendDirect(base44, owner, account, `🎤 ${displayName} artık ${agency.name} ajansının yayıncısı!`).catch(() => {});
        await notifyUser(base44, {
          user_id: owner.id, type: 'agency_member',
          title: '🎤 Yeni yayıncı', body: `${displayName} davetini kabul etti ve ${agency.name} ajansına katıldı.`, link: '/profil',
        }).catch(() => {});
      }
      return Response.json({ ok: true, accepted: true, agency: { name: agency.name, agency_id: agency.agency_id } });
    }

    if (action === 'invite-cancel') {
      const invite = await base44.asServiceRole.entities.AgencyInvite.get(String(body.invite_id || '')).catch(() => null);
      if (!invite || (invite.owner_id !== account.id && !isAdmin)) return Response.json({ error: 'Davet bulunamadı.' }, { status: 404 });
      await base44.asServiceRole.entities.AgencyInvite.update(invite.id, { status: 'cancelled', responded_at: new Date().toISOString() });
      return Response.json({ ok: true });
    }

    // ——— YAYINCI PANELİ ———
    if (action === 'broadcaster') {
      await syncQuotaRewards(base44, account.id).catch(() => {});
      const [fresh, agency, tiers, rewards] = await Promise.all([
        base44.asServiceRole.entities.User.get(account.id).catch(() => account),
        account.agency_record_id ? base44.asServiceRole.entities.Agency.get(account.agency_record_id).catch(() => null) : null,
        ensureQuotaTiers(base44),
        base44.asServiceRole.entities.QuotaReward.filter({ user_id: account.id }, '-created_date', 300).catch(() => []),
      ]);
      const period = periodKey();
      const month = Number(fresh?.diamond_month) || 0;
      const active = (tiers || []).filter((tier) => tier.active !== false);
      const nextTier = active.find((tier) => Number(tier.diamonds) > month) || null;
      const rows = rewards || [];
      return Response.json({
        profile: { name: displayName, username: account.username || '', avatar: account.avatar || '', member_id: account.member_id || '-', agency_role: fresh?.agency_role || '', broadcaster_status: fresh?.broadcaster_status || '' },
        agency: agency ? {
          name: agency.name, agency_id: agency.agency_id, logo: agency.logo || '',
          description: agency.description || '', rules: agency.rules || AGENCY_RULES.join('\n'),
          owner_name: agency.owner_name || '', member_count: agency.member_count || 0,
          commission_per_200k: Number(agency.commission_per_200k) || AGENCY_COMMISSION_PER_200K,
        } : null,
        diamonds: { month, total: Math.round((Number(fresh?.gift_received_k) || 0) * 1000) },
        tiers: active,
        next_tier: nextTier,
        period,
        rewards: rows.map((row) => ({
          id: row.id, tier_id: row.tier_id, diamonds: Number(row.diamonds) || 0, amount: Number(row.amount) || 0,
          agency_amount: Number(row.agency_amount) || 0, status: row.status || 'pending', period: row.period || '',
          transaction_id: row.transaction_id || '', completed_at: row.completed_at || row.created_date,
        })),
        totals: {
          pending: Math.round(rows.filter((row) => row.status !== 'paid').reduce((sum, row) => sum + (Number(row.amount) || 0), 0) * 100) / 100,
          paid: Math.round(rows.filter((row) => row.status === 'paid').reduce((sum, row) => sum + (Number(row.amount) || 0), 0) * 100) / 100,
          total: Math.round(rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0) * 100) / 100,
          count: rows.length,
        },
      });
    }

    // ——— AJANS PANELİ (sahip) ———
    if (action === 'agency-panel') {
      // Panel, sahip olunan ajansı gösterir; yayıncı üyeliği başka ajanda olabilir.
      const agency = await loadOwnedAgency();
      if (!agency) return Response.json({ error: 'Bir ajansa bağlı değilsin.' }, { status: 404 });
      const data = await agencyStats(base44, agency);
      return Response.json({ ...data, is_owner: agency.owner_id === account.id });
    }

    // ——— AJANS DEĞİŞİKLİĞİ (TRANSFER) ———
    if (action === 'transfer-request') {
      const code = String(body.agency_code || '').trim().toUpperCase();
      if (!/^AG-\d{6}$/.test(code)) return Response.json({ error: 'Geçerli bir ajans kimliği gir (AG-000000).' }, { status: 400 });
      if (!account.agency_record_id || !account.agency_code) return Response.json({ error: 'Bir ajansa bağlı değilsin.' }, { status: 400 });
      if (account.agency_role === 'owner') return Response.json({ error: 'Ajans sahibi transfer olamaz.' }, { status: 400 });
      if (account.agency_code === code) return Response.json({ error: 'Zaten bu ajansın yayıncısısın.' }, { status: 400 });
      const target = await findAgencyByCode(code);
      if (!target || target.active === false) return Response.json({ error: 'Bu kimliğe ait aktif bir ajans yok.' }, { status: 404 });
      const pending = await base44.asServiceRole.entities.AgencyTransfer.filter({ user_id: account.id, status: 'pending' }, '-created_date', 1).catch(() => []);
      if (pending?.length) return Response.json({ error: 'Zaten bekleyen bir transfer talebin var.' }, { status: 400 });
      const rl = await rateLimit(base44, 'agency-transfer:' + account.id, account.id, 10, 60000);
      if (!rl.allowed) return Response.json({ error: 'Çok fazla talep, biraz bekleyin.' }, { status: 429 });
      const transfer = await base44.asServiceRole.entities.AgencyTransfer.create({
        user_id: account.id, user_name: displayName, user_avatar: account.avatar || '',
        from_agency_id: account.agency_record_id, from_agency_code: account.agency_code, from_agency_name: account.agency_name || '',
        from_owner_id: account.agency_owner_id || '', to_agency_id: target.id, to_agency_code: target.agency_id,
        to_agency_name: target.name, to_owner_id: target.owner_id, status: 'pending',
      });
      const notice = `${displayName} başka bir ajansa transfer olmak istiyor. Yeni Ajans: ${target.name} (${target.agency_id})`;
      const [fromOwner, toOwner] = await Promise.all([
        account.agency_owner_id ? base44.asServiceRole.entities.User.get(account.agency_owner_id).catch(() => null) : null,
        base44.asServiceRole.entities.User.get(target.owner_id).catch(() => null),
      ]);
      if (fromOwner) {
        await sendDirect(base44, fromOwner, account, notice).catch(() => {});
        await notifyUser(base44, { user_id: fromOwner.id, type: 'agency_transfer', title: '🔄 Transfer talebi', body: notice, link: '/profil' }).catch(() => {});
      }
      if (toOwner && toOwner.id !== fromOwner?.id) {
        await notifyUser(base44, { user_id: toOwner.id, type: 'agency_transfer_in', title: '🔄 Transfer talebi', body: `${displayName} ajansına transfer olmak istiyor.`, link: '/profil' }).catch(() => {});
      }
      return Response.json({ ok: true, transfer });
    }

    if (action === 'transfer-respond') {
      const transfer = await base44.asServiceRole.entities.AgencyTransfer.get(String(body.transfer_id || '')).catch(() => null);
      if (!transfer || transfer.status !== 'pending') return Response.json({ error: 'Talep bulunamadı.' }, { status: 404 });
      // Normal transfer yalnızca yönetici incelemesiyle tamamlanır.
      if (transfer.mode === 'manual') return Response.json({ error: 'Bu talep yönetici incelemesinde; ajans sahibi onayı gerekmez.' }, { status: 400 });
      const isFromOwner = transfer.from_owner_id === account.id;
      const isToOwner = transfer.to_owner_id === account.id;
      if (!isFromOwner && !isToOwner && !isAdmin) return Response.json({ error: 'Yetkisiz.' }, { status: 403 });
      if (!body.accept) {
        await base44.asServiceRole.entities.AgencyTransfer.update(transfer.id, { status: 'rejected', decided_at: new Date().toISOString() });
        await notifyUser(base44, { user_id: transfer.user_id, type: 'agency_transfer_result', title: 'Transfer reddedildi', body: `${transfer.to_agency_name} ajansına transfer talebin reddedildi.`, link: '/profil' }).catch(() => {});
        return Response.json({ ok: true, status: 'rejected' });
      }
      const patch: any = {};
      if (isFromOwner) { patch.from_approved = true; patch.from_decided_at = new Date().toISOString(); }
      if (isToOwner) { patch.to_approved = true; patch.to_decided_at = new Date().toISOString(); }
      const fromApproved = isFromOwner ? true : !!transfer.from_approved;
      const toApproved = isToOwner ? true : !!transfer.to_approved;
      if (!(fromApproved && toApproved)) {
        await base44.asServiceRole.entities.AgencyTransfer.update(transfer.id, patch);
        const waitingId = fromApproved ? transfer.to_owner_id : transfer.from_owner_id;
        if (waitingId) {
          await notifyUser(base44, {
            user_id: waitingId, type: 'agency_transfer_wait', title: '🔄 Transfer onayı bekleniyor',
            body: `${transfer.user_name} için transfer talebi onayını bekliyor. Yeni ajans: ${transfer.to_agency_name}.`, link: '/profil',
          }).catch(() => {});
        }
        return Response.json({ ok: true, status: 'pending', from_approved: fromApproved, to_approved: toApproved });
      }
      // İki taraf da onayladı: transfer tamamlanır.
      const target = await base44.asServiceRole.entities.Agency.get(transfer.to_agency_id).catch(() => null);
      const member = await base44.asServiceRole.entities.User.get(transfer.user_id).catch(() => null);
      if (!target || !member) return Response.json({ error: 'Transfer tamamlanamadı.' }, { status: 400 });
      await base44.asServiceRole.entities.User.update(member.id, {
        agency_code: target.agency_id, agency_record_id: target.id, agency_name: target.name,
        agency_owner_id: target.owner_id, agency_role: 'broadcaster', broadcaster_status: 'active',
      });
      await base44.asServiceRole.entities.AgencyTransfer.update(transfer.id, { ...patch, status: 'completed', decided_at: new Date().toISOString() });
      await Promise.all([
        refreshAgencyTotals(base44, target.id).catch(() => {}),
        transfer.from_agency_id ? refreshAgencyTotals(base44, transfer.from_agency_id).catch(() => {}) : null,
      ]);
      await notifyUser(base44, {
        user_id: member.id, type: 'agency_transfer_result', title: '✅ Transfer tamamlandı',
        body: `${transfer.from_agency_name || 'Eski ajans'} → ${transfer.to_agency_name} transferin tamamlandı.`, link: '/profil',
      }).catch(() => {});
      const toOwner = await base44.asServiceRole.entities.User.get(target.owner_id).catch(() => null);
      if (toOwner) await sendDirect(base44, toOwner, member, `🔄 ${transfer.user_name} artık ${target.name} ajansının yayıncısı!`).catch(() => {});
      return Response.json({ ok: true, status: 'completed' });
    }

    if (action === 'transfer-cancel') {
      const transfer = await base44.asServiceRole.entities.AgencyTransfer.get(String(body.transfer_id || '')).catch(() => null);
      if (!transfer || transfer.user_id !== account.id || transfer.status !== 'pending') return Response.json({ error: 'Talep bulunamadı.' }, { status: 404 });
      await base44.asServiceRole.entities.AgencyTransfer.update(transfer.id, { status: 'cancelled', decided_at: new Date().toISOString() });
      return Response.json({ ok: true });
    }

    // ——— NORMAL TRANSFER: FOTOĞRAF + YÖNETİCİ İNCELEMESİ ———
    // Ajans sahibi engellenmiş ya da hesabını kapatmışsa sahip onayı alınamaz: yayıncı
    // fotoğraflı talep gönderir, yönetici onayladığında yeni ajansa otomatik geçer.
    if (action === 'manual-transfer-request') {
      const code = String(body.agency_code || '').trim().toUpperCase();
      if (!/^AG-\d{6}$/.test(code)) return Response.json({ error: 'Geçerli bir ajans kimliği gir (AG-000000).' }, { status: 400 });
      if (!account.agency_record_id || !account.agency_code) return Response.json({ error: 'Bir ajansa bağlı değilsin.' }, { status: 400 });
      if (account.agency_role === 'owner') return Response.json({ error: 'Ajans sahibi transfer olamaz.' }, { status: 400 });
      if (account.agency_code === code) return Response.json({ error: 'Zaten bu ajansın üyesisin.' }, { status: 400 });
      const photo = String(body.photo_uri || '');
      if (!photo || photo.length > 600) return Response.json({ error: 'İnceleme için bir fotoğraf gönder.' }, { status: 400 });
      const target = await findAgencyByCode(code);
      if (!target || !isAgencyActive(target)) return Response.json({ error: 'Bu kimliğe ait aktif bir ajans yok.' }, { status: 404 });
      const opened = await base44.asServiceRole.entities.AgencyTransfer
        .filter({ user_id: account.id, status: 'pending' }, '-created_date', 5).catch(() => []);
      if ((opened || []).some((row: any) => row.mode === 'manual')) {
        return Response.json({ error: 'Zaten incelemede olan bir normal transfer talebin var.' }, { status: 400 });
      }
      const rl = await rateLimit(base44, 'agency-manual-transfer:' + account.id, account.id, 10, 60000);
      if (!rl.allowed) return Response.json({ error: 'Çok fazla talep, biraz bekleyin.' }, { status: 429 });
      const transfer = await base44.asServiceRole.entities.AgencyTransfer.create({
        mode: 'manual', photo_uri: photo, note: String(body.note || '').trim().slice(0, 300),
        user_id: account.id, user_name: displayName, user_avatar: account.avatar || '',
        from_agency_id: account.agency_record_id, from_agency_code: account.agency_code,
        from_agency_name: account.agency_name || '', from_owner_id: account.agency_owner_id || '',
        to_agency_id: target.id, to_agency_code: target.agency_id, to_agency_name: target.name,
        to_owner_id: target.owner_id, status: 'pending',
      });
      await notifyAdmins(base44, {
        event: 'agency_manual_transfer',
        title: '📄 Normal transfer talebi',
        body: `${displayName}: ${account.agency_name || 'Eski ajans'} → ${target.name} (${target.agency_id}) normal transfer talebi inceleme bekliyor.`,
        link: '/admin/ajanslar',
      }).catch(() => {});
      return Response.json({ ok: true, transfer });
    }

    if (action === 'manual-transfer-cancel') {
      const transfer = await base44.asServiceRole.entities.AgencyTransfer.get(String(body.transfer_id || '')).catch(() => null);
      if (!transfer || transfer.mode !== 'manual' || transfer.user_id !== account.id || transfer.status !== 'pending') {
        return Response.json({ error: 'Talep bulunamadı.' }, { status: 404 });
      }
      await base44.asServiceRole.entities.AgencyTransfer.update(transfer.id, { status: 'cancelled', decided_at: new Date().toISOString() });
      return Response.json({ ok: true });
    }

    if (action === 'transfers') {
      const rows = await base44.asServiceRole.entities.AgencyTransfer.filter({
        $or: [{ user_id: account.id }, { from_owner_id: account.id }, { to_owner_id: account.id }],
      }, '-created_date', 200).catch(() => []);
      const manual = (row: any) => row.mode === 'manual';
      const mine = (rows || []).filter((row) => row.user_id === account.id);
      // Normal transfer talepleri sahip onayına düşmez: yalnızca yönetici inceler.
      const approvals = (rows || []).filter((row) => row.user_id !== account.id && row.status === 'pending' && !manual(row));
      return Response.json({ mine, manual: mine.filter(manual), approvals, history: rows || [] });
    }

    // ——— ÜYE KİMLİĞİYLE KULLANICI ARAMA (davet için) ———
    if (action === 'invite-lookup') {
      // Sahip kendi ajansı için, asistan üye olduğu ajans için arama yapar.
      const lookupAgency = await loadOwnedAgency();
      if (!lookupAgency && (account.agency_role !== 'assistant' || !account.agency_record_id)) {
        return Response.json({ error: 'Yalnızca ajans sahibi ve asistanları arama yapabilir.' }, { status: 403 });
      }
      const memberId = String(body.member_id || '').trim().replace('#', '');
      if (!memberId) return Response.json({ error: 'Üye kimliği gerekli.' }, { status: 400 });
      const rows = await base44.asServiceRole.entities.User.filter({ member_id: memberId }, '-created_date', 5).catch(() => []);
      const found = (rows || []).find((row) => row.id !== account.id);
      if (!found) return Response.json({ user: null });
      const inSameAgency = found.agency_record_id === (lookupAgency?.id || account.agency_record_id);
      return Response.json({
        user: {
          id: found.id, name: found.username || found.full_name || 'Kullanıcı', avatar: found.avatar || '',
          member_id: found.member_id || '-', agency_name: inSameAgency ? (found.agency_name || 'Ajansın') : (found.agency_name || ''),
          agency_role: found.agency_role || '', in_agency: !!found.agency_record_id, in_same_agency: inSameAgency && !!lookupAgency,
          friend: await isFriendOf(account.id, found.id),
          invite_blocked: await isDuplicateAccount(found.id),
        },
      });
    }

    // ——— AJANS SORGUSU (ajans değişikliği başvurusu için) ———
    if (action === 'agency-lookup') {
      const code = String(body.agency_code || '').trim().toUpperCase();
      if (!/^AG-\d{6}$/.test(code)) return Response.json({ error: 'Geçerli bir ajans kimliği gir (AG-000000).' }, { status: 400 });
      if (account.agency_code === code) return Response.json({ error: 'Zaten bu ajansın üyesisin.' }, { status: 400 });
      const found = await findAgencyByCode(code);
      if (!found || !isAgencyActive(found)) return Response.json({ error: 'Bu kimliğe ait aktif bir ajans yok.' }, { status: 404 });
      return Response.json({
        agency: {
          id: found.id, name: found.name, agency_id: found.agency_id, logo: found.logo || '',
          description: found.description || '', owner_name: found.owner_name || '',
          member_count: Number(found.member_count) || 0,
          total_diamonds: Number(found.total_diamonds) || 0,
          commission_per_200k: Number(found.commission_per_200k) || AGENCY_COMMISSION_PER_200K,
          status: found.status || 'active',
        },
      });
    }

    // ——— ASİSTANLIK ———
    if (action === 'assistant-appoint') {
      const agency = await loadOwnedAgency();
      if (!agency) return Response.json({ error: 'Yalnızca ajans sahibi asistanlık verebilir.' }, { status: 403 });
      if (!isAgencyActive(agency)) return Response.json({ error: 'Ajansın onaylandıktan sonra asistan verebilirsin.' }, { status: 403 });
      const targetId = String(body.user_id || '');
      if (!targetId || targetId === account.id) return Response.json({ error: 'Geçersiz kullanıcı.' }, { status: 400 });
      const target = await base44.asServiceRole.entities.User.get(targetId).catch(() => null);
      if (!target) return Response.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
      // Kendi ajansının üyesine asistanlık verilebilir; başka bir ajansa bağlı kişi önce ayrılmalıdır.
      const selfMember = target.agency_record_id === agency.id;
      if (target.agency_record_id && !selfMember) return Response.json({ error: 'Bu kullanıcı zaten bir ajansa bağlı.' }, { status: 400 });
      const share = ASSISTANT_SHARES.includes(Number(body.share)) ? Number(body.share) : ASSISTANT_SHARES[0];
      await expireAssistantInvites(base44, agency).catch(() => {});
      const current = (agency.assistants || []).filter((row: any) => row.status === 'invited' || row.status === 'active');
      if (current.length >= ASSISTANT_LIMIT) return Response.json({ error: `En fazla ${ASSISTANT_LIMIT} asistan verebilirsin.` }, { status: 400 });
      if (current.some((row: any) => row.user_id === target.id)) return Response.json({ error: 'Bu kullanıcıya zaten asistanlık verildi.' }, { status: 400 });
      const rl = await rateLimit(base44, 'agency-assistant:' + account.id, account.id, 20, 60000);
      if (!rl.allowed) return Response.json({ error: 'Çok fazla deneme, biraz bekleyin.' }, { status: 429 });
      const expiresAt = assistantInviteExpiry();
      const invite = await base44.asServiceRole.entities.AgencyInvite.create({
        kind: 'assistant', share, expires_at: expiresAt,
        agency_record_id: agency.id, agency_code: agency.agency_id, agency_name: agency.name,
        agency_logo: agency.logo || '', agency_description: agency.description || '', agency_rules: agency.rules || AGENCY_RULES.join('\n'),
        owner_id: account.id, owner_name: displayName, owner_avatar: account.avatar || '',
        invitee_id: target.id, invitee_name: target.username || target.full_name || 'Kullanıcı', invitee_avatar: target.avatar || '',
        invitee_member_id: target.member_id || '',
        status: 'pending',
      });
      const entry = {
        user_id: target.id, name: target.username || target.full_name || 'Kullanıcı', avatar: target.avatar || '',
        member_id: target.member_id || '-', share, status: 'invited', invite_id: invite.id,
        // Ajansın kendi üyesi davet edildiyse kaldırma işleminde üyeliği korunur.
        from_agency: selfMember,
        invited_at: new Date().toISOString(), expires_at: expiresAt,
      };
      const assistants = [...(agency.assistants || []).filter((row: any) => row.user_id !== target.id), entry];
      await base44.asServiceRole.entities.Agency.update(agency.id, { assistants });
      // Asistanlık daveti sohbet mesajı olarak gitmez: sistem bildirimine düşer,
      // detay kartından ajans ve davet edilen bilgileriyle onaylanır.
      await notifyUser(base44, {
        user_id: target.id, type: 'assistant_invite', title: '🤝 Asistanlık daveti',
        body: assistantInviteText({
          ownerName: displayName, ownerMemberId: account.member_id || '-', agencyName: agency.name, agencyId: agency.agency_id, share,
        }),
        link: '/bildirimler', ref_id: inviteRefId(invite.id),
      }).catch(() => {});
      return Response.json({ ok: true, invite, assistants });
    }

    if (action === 'assistant-remove') {
      const agency = await loadOwnedAgency();
      if (!agency) return Response.json({ error: 'Yalnızca ajans sahibi işlem yapabilir.' }, { status: 403 });
      const targetId = String(body.user_id || '');
      const entry = (agency.assistants || []).find((row: any) => row.user_id === targetId);
      if (!entry) return Response.json({ error: 'Asistan bulunamadı.' }, { status: 404 });
      await base44.asServiceRole.entities.Agency.update(agency.id, {
        assistants: (agency.assistants || []).map((row: any) => (row.user_id === targetId ? { ...row, status: 'removed' } : row)),
      });
      if (entry.status === 'invited' && entry.invite_id) {
        await base44.asServiceRole.entities.AgencyInvite.update(entry.invite_id, { status: 'cancelled', responded_at: new Date().toISOString() }).catch(() => {});
      }
      const target = await base44.asServiceRole.entities.User.get(targetId).catch(() => null);
      if (target && target.agency_record_id === agency.id && target.agency_role === 'assistant') {
        // Ajansın kendi üyesi asistanlıktan çıkarsa üyeliği korunur, rolü yayıncıya döner.
        const patch = entry.from_agency
          ? { agency_role: 'broadcaster' }
          : { agency_code: '', agency_record_id: '', agency_name: '', agency_owner_id: '', agency_role: '', broadcaster_status: '' };
        await base44.asServiceRole.entities.User.update(target.id, patch).catch(() => {});
      }
      if (target) {
        await notifyUser(base44, {
          user_id: target.id, type: 'assistant_removed', title: 'Asistanlık sona erdi',
          body: `${agency.name} ajansındaki asistanlığın sona erdi.`, link: '/profil',
        }).catch(() => {});
      }
      return Response.json({ ok: true });
    }

    // ——— ASİSTAN PANELİ ———
    if (action === 'assistant') {
      if (!account.agency_record_id) return Response.json({ error: 'Bir ajansa bağlı değilsin.' }, { status: 404 });
      const agency = await base44.asServiceRole.entities.Agency.get(account.agency_record_id).catch(() => null);
      if (!agency) return Response.json({ error: 'Ajans bulunamadı.' }, { status: 404 });
      const entry = activeAssistant(agency, account.id);
      if (!entry) return Response.json({ error: 'Asistanlığın aktif değil.' }, { status: 403 });
      const data = await agencyStats(base44, agency);
      const self = (data.assistants || []).find((row: any) => row.user_id === account.id) || entry;
      const rows = await base44.asServiceRole.entities.QuotaReward.filter({ assistant_id: account.id }, '-created_date', 300).catch(() => []);
      const sent = await base44.asServiceRole.entities.AgencyInvite
        .filter({ assistant_id: account.id, status: 'pending' }, '-created_date', 100).catch(() => []);
      const sum = (list: any[]) => Math.round(list.reduce((total: number, row: any) => total + (Number(row.amount) || 0), 0) * 100) / 100;
      return Response.json({
        profile: { name: displayName, avatar: account.avatar || '', member_id: account.member_id || '-', agency_role: 'assistant' },
        assistant: { ...entry, share: Number(entry.share) || 0, broadcaster_count: self.broadcaster_count || 0 },
        agency: data.agency,
        members: self.members || [],
        invites_sent: sent || [],
        tiers: data.tiers || [],
        next_tier: null,
        period: periodKey(),
        diamonds: { month: 0, total: 0 },
        rewards: rows.map((row: any) => ({
          id: row.id, tier_id: row.tier_id, diamonds: Number(row.diamonds) || 0, amount: Number(row.amount) || 0,
          agency_amount: 0, status: row.status || 'pending', period: row.period || '',
          transaction_id: row.transaction_id || '', completed_at: row.completed_at || row.created_date,
        })),
        totals: {
          pending: sum(rows.filter((row: any) => row.status !== 'paid')),
          paid: sum(rows.filter((row: any) => row.status === 'paid')),
          total: sum(rows),
          count: rows.length,
          share: Number(entry.share) || 0,
        },
      });
    }

    // ——— ADMİN ———
    if (action.startsWith('admin-')) {
      if (!isAdmin) return Response.json({ error: 'Yetkisiz.' }, { status: 403 });
      if (action === 'admin-list') {
        const [agencies, broadcasters, transfers, tiers, rewards] = await Promise.all([
          base44.asServiceRole.entities.Agency.list('-created_date', 200).catch(() => []),
          base44.asServiceRole.entities.User.filter({ agency_role: 'broadcaster' }, '-created_date', 500).catch(() => []),
          base44.asServiceRole.entities.AgencyTransfer.list('-created_date', 200).catch(() => []),
          ensureQuotaTiers(base44),
          base44.asServiceRole.entities.QuotaReward.list('-created_date', 300).catch(() => []),
        ]);
        return Response.json({
          agencies: agencies || [],
          broadcasters: (broadcasters || []).map((row) => ({
            id: row.id, name: row.username || row.full_name || 'Yayıncı', username: row.username || '', avatar: row.avatar || '',
            member_id: row.member_id || '-', agency_name: row.agency_name || '', agency_code: row.agency_code || '',
            agency_record_id: row.agency_record_id || '', status: row.broadcaster_status || '', diamonds: Number(row.diamond_month) || 0,
            total_diamonds: Math.round((Number(row.gift_received_k) || 0) * 1000),
          })),
          transfers: transfers || [],
          // Fotoğraflı normal transfer talepleri ayrı sekmede incelenir.
          manual_transfers: (transfers || []).filter((row: any) => row.mode === 'manual'),
          tiers: tiers || [], rewards: rewards || [],
        });
      }
      if (action === 'admin-agency-save') {
        const name = String(body.name || '').trim().slice(0, 60);
        if (name.length < 3) return Response.json({ error: 'Ajans adı en az 3 karakter olmalı.' }, { status: 400 });
        const patch: any = {
          name, description: String(body.description || '').trim().slice(0, 400), logo: String(body.logo || ''),
          commission_per_200k: Math.max(0, Number(body.commission_per_200k) || AGENCY_COMMISSION_PER_200K),
        };
        if (body.agency_id) {
          const updated = await base44.asServiceRole.entities.Agency.update(body.agency_id, patch);
          await syncAgencyName(body.agency_id, name);
          return Response.json({ ok: true, agency: updated });
        }
        const owner = body.owner_user_id
          ? await base44.asServiceRole.entities.User.get(String(body.owner_user_id)).catch(() => null)
          : await findUserByMemberId(body.owner_member_id);
        if (!owner) return Response.json({ error: 'Sahip bulunamadı, üye kimliğini kontrol et.' }, { status: 400 });
        let agency: any = null;
        for (let attempt = 0; attempt < 5 && !agency; attempt += 1) {
          const code = generateAgencyCode();
          if (await findAgencyByCode(code)) continue;
          agency = await base44.asServiceRole.entities.Agency.create({
            ...patch, agency_id: code, rules: AGENCY_RULES.join('\n'),
            owner_id: owner.id, owner_name: owner.username || owner.full_name || 'Kullanıcı', owner_avatar: owner.avatar || '',
            active: true, status: 'active',
          }).catch(() => null);
        }
        if (!agency) return Response.json({ error: 'Ajans oluşturulamadı.' }, { status: 500 });
        // Admin kurduğu ajans aktif sayılır; kişinin başka ajandaki yayıncılığı korunur.
        const ownPatch: any = ownedAgencyPatch({ ...agency, status: 'active' }, 'active');
        if (!owner.agency_record_id) Object.assign(ownPatch, userPatch(agency));
        await withLimitRetry(() => base44.asServiceRole.entities.User.update(owner.id, ownPatch));
        return Response.json({ ok: true, agency });
      }
      if (action === 'admin-agency-decide') {
        const agency = await base44.asServiceRole.entities.Agency.get(String(body.agency_id || '')).catch(() => null);
        if (!agency) return Response.json({ error: 'Ajans bulunamadı.' }, { status: 404 });
        const owner = await base44.asServiceRole.entities.User.get(agency.owner_id).catch(() => null);
        if (body.approve) {
          await base44.asServiceRole.entities.Agency.update(agency.id, { status: 'active', active: true, reviewed_at: new Date().toISOString() });
          if (owner) {
            // Sahiplik ayrı yazılır: sahip başka bir ajanda yayıncıysa üyeliği bozulmaz.
            const ownPatch: any = ownedAgencyPatch({ ...agency, status: 'active' }, 'active');
            if (!owner.agency_record_id) Object.assign(ownPatch, userPatch({ ...agency, status: 'active' }));
            await withLimitRetry(() => base44.asServiceRole.entities.User.update(owner.id, ownPatch));
            await notifyUser(base44, {
              user_id: owner.id, type: 'agency_approved', title: '✅ Ajansın onaylandı',
              body: `${agency.name} (${agency.agency_id}) ajansı onaylandı. Artık yayıncı davet edebilirsin.`, link: '/profil',
            }).catch(() => {});
          }
          return Response.json({ ok: true, status: 'active' });
        }
        await base44.asServiceRole.entities.Agency.update(agency.id, { status: 'rejected', active: false, reviewed_at: new Date().toISOString() });
        if (owner) {
          // Yalnızca bu ajansa bağlı üyelik temizlenir; başka ajandaki yayıncılık sürer.
          const rejectPatch: any = clearOwnedAgencyPatch();
          if (owner.agency_record_id === agency.id) {
            Object.assign(rejectPatch, { agency_code: '', agency_record_id: '', agency_name: '', agency_owner_id: '', agency_role: '', broadcaster_status: '' });
          }
          await withLimitRetry(() => base44.asServiceRole.entities.User.update(owner.id, rejectPatch));
          await notifyUser(base44, {
            user_id: owner.id, type: 'agency_rejected', title: '❌ Ajans başvurun reddedildi',
            body: `${agency.name} başvurun onaylanmadı. Dilersen yeniden başvurabilirsin.`, link: '/profil',
          }).catch(() => {});
        }
        return Response.json({ ok: true, status: 'rejected' });
      }
      if (action === 'admin-agency-delete') {
        const agency = await base44.asServiceRole.entities.Agency.get(String(body.agency_id || '')).catch(() => null);
        const agencyId = agency?.id || String(body.agency_id || '');
        if (!agencyId) return Response.json({ error: 'Ajans bulunamadı.' }, { status: 404 });
        // Üyeler, ajansın sahibi ve bekleyen davetler tek turda okunur; yazmalar tek tek ve
        // yoğunluk hatasında tekrar denemeli yapılır ki buton hataya düşmesin.
        const [members, owners, invites] = await Promise.all([
          base44.asServiceRole.entities.User.filter({ agency_record_id: agencyId }, '-created_date', 500).catch(() => []),
          base44.asServiceRole.entities.User.filter({ owned_agency_id: agencyId }, '-created_date', 20).catch(() => []),
          base44.asServiceRole.entities.AgencyInvite.filter({ agency_record_id: agencyId, status: 'pending' }, '-created_date', 500).catch(() => []),
        ]);
        const cleared: any = { agency_code: '', agency_record_id: '', agency_name: '', agency_owner_id: '', agency_role: '', broadcaster_status: '' };
        for (const member of members || []) {
          await withLimitRetry(() => base44.asServiceRole.entities.User.update(member.id, cleared)).catch(() => {});
        }
        // Ajans silinince sahibinin profilindeki "ajansım" bağlantısı da kalkar.
        for (const owner of owners || []) {
          await withLimitRetry(() => base44.asServiceRole.entities.User.update(owner.id, clearOwnedAgencyPatch())).catch(() => {});
        }
        if (invites?.length) {
          await withLimitRetry(() => base44.asServiceRole.entities.AgencyInvite
            .bulkUpdate(invites.map((invite: any) => ({ id: invite.id, status: 'cancelled' })))).catch(() => {});
        }
        // Ajans kaydı daha önce silinmişse (panelde kalan kart) hata verilmez:
        // geriye kalan izler temizlenir ve işlem başarılı sayılır.
        if (!agency) return Response.json({ ok: true, already_deleted: true });
        // Kısa süreli yoğunluk hatasında silme tekrar denenir: işlem yarım kalmaz.
        await withLimitRetry(() => base44.asServiceRole.entities.Agency.delete(agencyId));
        return Response.json({ ok: true });
      }
      if (action === 'admin-set-owner') {
        const agency = await base44.asServiceRole.entities.Agency.get(String(body.agency_id || '')).catch(() => null);
        const owner = body.user_id
          ? await base44.asServiceRole.entities.User.get(String(body.user_id)).catch(() => null)
          : await findUserByMemberId(body.member_id);
        if (!agency || !owner) return Response.json({ error: 'Ajans veya kullanıcı bulunamadı.' }, { status: 404 });
        const previous = agency.owner_id;
        await base44.asServiceRole.entities.Agency.update(agency.id, {
          owner_id: owner.id, owner_name: owner.username || owner.full_name || 'Kullanıcı', owner_avatar: owner.avatar || '',
        });
        await withLimitRetry(() => base44.asServiceRole.entities.User.update(owner.id, userPatch({ ...agency, owner_id: owner.id })));
        if (previous && previous !== owner.id) {
          await withLimitRetry(() => base44.asServiceRole.entities.User.update(previous, { agency_role: 'broadcaster', broadcaster_status: 'active' })).catch(() => {});
        }
        return Response.json({ ok: true });
      }
      if (action === 'admin-broadcaster-add') {
        const member = body.user_id
          ? await base44.asServiceRole.entities.User.get(String(body.user_id)).catch(() => null)
          : await findUserByMemberId(body.member_id);
        const agency = await base44.asServiceRole.entities.Agency.get(String(body.agency_id || '')).catch(() => null);
        if (!member || !agency) return Response.json({ error: 'Kullanıcı veya ajans bulunamadı.' }, { status: 404 });
        await withLimitRetry(() => base44.asServiceRole.entities.User.update(member.id, userPatch({ ...agency, owner_id: agency.owner_id })));
        await refreshAgencyTotals(base44, agency.id).catch(() => {});
        return Response.json({ ok: true });
      }
      if (action === 'admin-broadcaster-remove') {
        const member = await base44.asServiceRole.entities.User.get(String(body.user_id || '')).catch(() => null);
        if (!member) return Response.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
        const agencyId = member.agency_record_id;
        await withLimitRetry(() => base44.asServiceRole.entities.User.update(member.id, { agency_code: '', agency_record_id: '', agency_name: '', agency_owner_id: '', agency_role: '', broadcaster_status: '' }));
        if (agencyId) await refreshAgencyTotals(base44, agencyId).catch(() => {});
        return Response.json({ ok: true });
      }
      if (action === 'admin-broadcaster-status') {
        const status = body.status === 'active' ? 'active' : 'inactive';
        await withLimitRetry(() => base44.asServiceRole.entities.User.update(String(body.user_id || ''), { broadcaster_status: status }));
        return Response.json({ ok: true, status });
      }
      if (action === 'admin-tier-save') {
        const payload = {
          diamonds: Math.max(1, Number(body.diamonds) || 0),
          broadcaster_dollars: Math.max(0, Number(body.broadcaster_dollars) || 0),
          agency_dollars: Math.max(0, Number(body.agency_dollars) || agencyCommissionFor(body.diamonds)),
          active: body.active !== false,
        };
        if (!body.diamonds) return Response.json({ error: 'Elmas miktarı gerekli.' }, { status: 400 });
        if (body.id) {
          const updated = await base44.asServiceRole.entities.QuotaTier.update(body.id, payload);
          return Response.json({ ok: true, tier: updated });
        }
        const tiers = await base44.asServiceRole.entities.QuotaTier.list('sort_order', 500).catch(() => []);
        const created = await base44.asServiceRole.entities.QuotaTier.create({ ...payload, sort_order: (tiers?.length || 0) + 1 });
        return Response.json({ ok: true, tier: created });
      }
      if (action === 'admin-tier-delete') {
        await withLimitRetry(() => base44.asServiceRole.entities.QuotaTier.delete(String(body.id || '')));
        return Response.json({ ok: true });
      }
      if (action === 'admin-reward-paid') {
        const paid = body.paid !== false;
        const nowIso = new Date().toISOString();
        // Kart bazlı işaretleme: kişinin panelde tek kartta toplanan tüm kota kayıtları birlikte güncellenir.
        if (!body.reward_id && body.user_id) {
          const rows = await base44.asServiceRole.entities.QuotaReward.filter({ user_id: body.user_id }, '-created_date', 500).catch(() => []);
          if (!rows?.length) return Response.json({ error: 'Kayıt bulunamadı.' }, { status: 404 });
          await withLimitRetry(() => base44.asServiceRole.entities.QuotaReward.bulkUpdate(rows.map((row: any) => ({
            id: row.id, status: paid ? 'paid' : 'pending', paid_at: paid ? nowIso : null,
          }))));
          const cardTotal = Math.round(rows.reduce((sum: number, row: any) => sum + (Number(row.amount) || 0), 0) * 100) / 100;
          if (paid) {
            await notifyUser(base44, {
              user_id: body.user_id, type: 'quota_paid', title: '💸 Ödeme yapıldı',
              body: `$${cardTotal} tutarındaki kota kazancın ödendi olarak işaretlendi.`, link: '/profil',
            }).catch(() => {});
          }
          return Response.json({ ok: true, user_id: body.user_id, ids: rows.map((row: any) => row.id) });
        }
        const updated = await base44.asServiceRole.entities.QuotaReward.update(String(body.reward_id || ''), {
          status: paid ? 'paid' : 'pending', paid_at: paid ? nowIso : null,
        });
        if (paid) {
          await notifyUser(base44, {
            user_id: updated.user_id, type: 'quota_paid', title: '💸 Ödeme yapıldı',
            body: `$${updated.amount} tutarındaki kota kazancın ödendi olarak işaretlendi.`, link: '/profil',
          }).catch(() => {});
        }
        return Response.json({ ok: true, reward: updated });
      }
      // Normal transfer kararı: onaylanırsa yayıncı yeni ajansa geçer, eski ajans
      // etiketi ve varsa asistanlığı kalkar.
      if (action === 'admin-manual-transfer-decide') {
        const transfer = await base44.asServiceRole.entities.AgencyTransfer.get(String(body.transfer_id || '')).catch(() => null);
        if (!transfer || transfer.mode !== 'manual' || transfer.status !== 'pending') {
          return Response.json({ error: 'Talep bulunamadı.' }, { status: 404 });
        }
        const note = String(body.note || '').trim().slice(0, 300);
        const now = new Date().toISOString();
        if (!body.approve) {
          await base44.asServiceRole.entities.AgencyTransfer.update(transfer.id, {
            status: 'rejected', reviewed_by: account.id, reviewed_at: now, decided_at: now, admin_note: note,
          });
          await notifyUser(base44, {
            user_id: transfer.user_id, type: 'agency_transfer_result', title: '❌ Normal transfer reddedildi',
            body: `${transfer.to_agency_name} ajansına normal transfer talebin reddedildi.${note ? ` Not: ${note}` : ''}`,
            link: '/ajans/transferler',
          }).catch(() => {});
          return Response.json({ ok: true, status: 'rejected' });
        }
        const target = await base44.asServiceRole.entities.Agency.get(transfer.to_agency_id).catch(() => null);
        if (!target || !isAgencyActive(target)) return Response.json({ error: 'Hedef ajans aktif değil.' }, { status: 400 });
        const member = await base44.asServiceRole.entities.User.get(transfer.user_id).catch(() => null);
        if (!member) return Response.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
        // Eski ajandaki asistanlık kalkar, üyelik yeni ajansa taşınır.
        await detachAssistant(base44, member.id).catch(() => {});
        await base44.asServiceRole.entities.User.update(member.id, {
          agency_code: target.agency_id, agency_record_id: target.id, agency_name: target.name,
          agency_owner_id: target.owner_id, agency_role: 'broadcaster', broadcaster_status: 'active',
        });
        await base44.asServiceRole.entities.AgencyTransfer.update(transfer.id, {
          status: 'completed', decided_at: now, reviewed_by: account.id, reviewed_at: now, admin_note: note,
        });
        await Promise.all([
          refreshAgencyTotals(base44, target.id).catch(() => {}),
          transfer.from_agency_id ? refreshAgencyTotals(base44, transfer.from_agency_id).catch(() => {}) : null,
        ]);
        await notifyUser(base44, {
          user_id: member.id, type: 'agency_transfer_result', title: '✅ Normal transfer tamamlandı',
          body: `${transfer.from_agency_name || 'Eski ajans'} → ${target.name} geçişin tamamlandı.`, link: '/ajans/transferler',
        }).catch(() => {});
        const newOwner = await base44.asServiceRole.entities.User.get(target.owner_id).catch(() => null);
        if (newOwner) await sendDirect(base44, newOwner, member, `🔄 ${transfer.user_name} artık ${target.name} ajansının yayıncısı!`).catch(() => {});
        return Response.json({ ok: true, status: 'completed' });
      }
      return Response.json({ error: 'Geçersiz admin işlemi.' }, { status: 400 });
    }

    return Response.json({ error: 'Geçersiz işlem.' }, { status: 400 });
  } catch (error) {
    return safeErrorResponse(error);
  }
}