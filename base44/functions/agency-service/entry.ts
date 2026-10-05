import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { rateLimit, safeErrorResponse } from '../../shared/security.ts';
import { notifyUser } from '../../shared/notifyUser.ts';
import { notifyAdmins } from '../../shared/adminNotify.ts';
import {
  AGENCY_RULES, AGENCY_COMMISSION_PER_200K, agencyCommissionFor, generateAgencyCode, ensureQuotaTiers,
  syncQuotaRewards, refreshAgencyTotals, agencyStats, sendDirect, inviteMarker, periodKey, todayKey,
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

    // Başvuru aşamasındaki (onaylanmamış) ajanslarla işlem yapılamaz.
    const isAgencyActive = (agency: any) => !!agency && agency.status !== 'pending' && agency.status !== 'rejected' && agency.active !== false;

    // Ajans adı, üyelerin profil kayıtlarına yansıtılır.
    const syncAgencyName = async (agencyId: string, name: string) => {
      const members = await base44.asServiceRole.entities.User.filter({ agency_record_id: agencyId }, '-created_date', 500).catch(() => []);
      for (const member of members || []) {
        await base44.asServiceRole.entities.User.update(member.id, { agency_name: name }).catch(() => {});
      }
    };

    // ——— ÖZET: profil bölümündeki dinamik menü için ———
    if (action === 'summary') {
      if (account.broadcaster_status === 'active' && account.agency_record_id) {
        await syncQuotaRewards(base44, account.id).catch(() => {});
      }
      const [agency, invites, sent, transfers] = await Promise.all([
        account.agency_record_id ? base44.asServiceRole.entities.Agency.get(account.agency_record_id).catch(() => null) : null,
        base44.asServiceRole.entities.AgencyInvite.filter({ invitee_id: account.id, status: 'pending' }, '-created_date', 50).catch(() => []),
        base44.asServiceRole.entities.AgencyInvite.filter({ owner_id: account.id, status: 'pending' }, '-created_date', 100).catch(() => []),
        base44.asServiceRole.entities.AgencyTransfer.filter({ user_id: account.id }, '-created_date', 20).catch(() => []),
      ]);
      return Response.json({
        profile: {
          agency_code: account.agency_code || '', agency_record_id: account.agency_record_id || '',
          agency_name: account.agency_name || '', agency_role: account.agency_role || '',
          broadcaster_status: account.broadcaster_status || '', agency_status: agency?.status || (account.agency_record_id ? 'active' : ''),
        },
        agency: agency ? { id: agency.id, name: agency.name, agency_id: agency.agency_id, logo: agency.logo || '', description: agency.description || '', member_count: agency.member_count || 0, total_earnings: agency.total_earnings || 0, owner_name: agency.owner_name || '', status: agency.status || 'active' } : null,
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
      if (account.agency_record_id) return Response.json({ error: 'Zaten bir ajansa bağlısın. Önce ajans değişikliği talebi gönder.' }, { status: 400 });
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
          commission_per_200k: AGENCY_COMMISSION_PER_200K, member_count: 0, active: true, status: 'active',
        }).catch(() => null);
      }
      if (!agency) return Response.json({ error: 'Ajans oluşturulamadı, tekrar deneyin.' }, { status: 500 });
      // Ajansı açan kişi doğrudan ajans sahibi olur; ayrı bir onay beklenmez.
      await base44.asServiceRole.entities.User.update(account.id, {
        agency_code: agency.agency_id, agency_record_id: agency.id, agency_owner_id: agency.owner_id,
        agency_role: 'owner', agency_name: name, broadcaster_status: '',
      });
      await notifyAdmins(base44, {
        event: 'agency_application', ref_id: `agency-application:${agency.id}`,
        title: '🏢 Yeni ajans kuruldu',
        body: `${displayName} "${name}" ajansını kurdu.`,
        link: '/admin/ajanslar',
      }).catch(() => {});
      await notifyUser(base44, {
        user_id: account.id, type: 'agency_applied', title: '🏢 Ajansın kuruldu',
        body: `${name} (${agency.agency_id}) ajansının sahibi oldun. Artık arkadaşlarını yayıncı olarak davet edebilirsin.`,
        link: '/ajans',
      }).catch(() => {});
      return Response.json({ ok: true, agency });
    }

    // ——— AJANS AYARLARI ———
    if (action === 'update') {
      if (account.agency_role !== 'owner' || !account.agency_record_id) return Response.json({ error: 'Ajans sahibi değilsin.' }, { status: 403 });
      const ownAgency = await base44.asServiceRole.entities.Agency.get(account.agency_record_id).catch(() => null);
      // Ayarlar başvuru aşamasında da düzenlenebilir.
      if (!ownAgency || ownAgency.owner_id !== account.id) return Response.json({ error: 'Ajans sahibi değilsin.' }, { status: 403 });
      const patch: any = {};
      if (typeof body.name === 'string' && body.name.trim().length >= 3) patch.name = body.name.trim().slice(0, 60);
      if (typeof body.description === 'string') patch.description = body.description.trim().slice(0, 400);
      if (typeof body.logo === 'string') patch.logo = body.logo;
      if (typeof body.rules === 'string') patch.rules = body.rules.trim().slice(0, 2000);
      if (!Object.keys(patch).length) return Response.json({ error: 'Değişiklik yok.' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.Agency.update(account.agency_record_id, patch);
      // Ajans adı üyelerin profiline yalnızca onaylanmış ajanslarda yansıtılır.
      if (patch.name && isAgencyActive({ ...ownAgency, ...patch })) await syncAgencyName(account.agency_record_id, patch.name);
      return Response.json({ ok: true, agency: updated });
    }

    // ——— YAYINCI DAVETİ ———
    if (action === 'invite') {
      if (account.agency_role !== 'owner' || !account.agency_record_id) return Response.json({ error: 'Yalnızca ajans sahibi davet gönderebilir.' }, { status: 403 });
      const targetId = String(body.user_id || '');
      if (!targetId || targetId === account.id) return Response.json({ error: 'Geçersiz kullanıcı.' }, { status: 400 });
      const target = await base44.asServiceRole.entities.User.get(targetId).catch(() => null);
      if (!target) return Response.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
      if (target.agency_record_id) return Response.json({ error: 'Bu kullanıcı zaten bir ajansa bağlı.' }, { status: 400 });
      if (!(await isFriendOf(account.id, target.id))) return Response.json({ error: 'Yalnızca arkadaşlarını yayıncı olarak davet edebilirsin. Önce arkadaş ekle.' }, { status: 403 });
      const rl = await rateLimit(base44, 'agency-invite:' + account.id, account.id, 40, 60000);
      if (!rl.allowed) return Response.json({ error: 'Çok fazla davet gönderdin, biraz bekleyin.' }, { status: 429 });
      const existing = await base44.asServiceRole.entities.AgencyInvite
        .filter({ agency_record_id: account.agency_record_id, invitee_id: targetId, status: 'pending' }, '-created_date', 1).catch(() => []);
      if (existing?.length) return Response.json({ error: 'Bu kullanıcıya zaten davet gönderildi.' }, { status: 400 });
      const agency = await base44.asServiceRole.entities.Agency.get(account.agency_record_id).catch(() => null);
      if (!agency) return Response.json({ error: 'Ajans bulunamadı.' }, { status: 404 });
      if (!isAgencyActive(agency)) return Response.json({ error: 'Ajansın onaylanmadan yayıncı davet edemezsin.' }, { status: 403 });
      const invite = await base44.asServiceRole.entities.AgencyInvite.create({
        agency_record_id: agency.id, agency_code: agency.agency_id, agency_name: agency.name,
        agency_logo: agency.logo || '', agency_description: agency.description || '',
        agency_rules: agency.rules || AGENCY_RULES.join('\n'),
        owner_id: account.id, owner_name: displayName, owner_avatar: account.avatar || '',
        invitee_id: target.id, invitee_name: target.username || target.full_name || 'Kullanıcı', invitee_avatar: target.avatar || '',
        status: 'pending',
      });
      await sendDirect(base44, account, target, inviteMarker(invite.id)).catch(() => {});
      await notifyUser(base44, {
        user_id: target.id, type: 'agency_invite',
        title: '🎤 Yayıncı daveti', body: `${displayName} sizi ${agency.name} ajansına yayıncı olarak davet etti.`, link: '/arkadaslar',
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
      if (!body.accept) {
        await base44.asServiceRole.entities.AgencyInvite.update(invite.id, { status: 'rejected', responded_at: new Date().toISOString() });
        return Response.json({ ok: true, accepted: false });
      }
      const agency = await base44.asServiceRole.entities.Agency.get(invite.agency_record_id).catch(() => null);
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
        agency: agency ? { name: agency.name, agency_id: agency.agency_id, logo: agency.logo || '', owner_name: agency.owner_name || '', member_count: agency.member_count || 0 } : null,
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
      if (!account.agency_record_id) return Response.json({ error: 'Bir ajansa bağlı değilsin.' }, { status: 404 });
      const agency = await base44.asServiceRole.entities.Agency.get(account.agency_record_id).catch(() => null);
      if (!agency) return Response.json({ error: 'Ajans bulunamadı.' }, { status: 404 });
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

    if (action === 'transfers') {
      const rows = await base44.asServiceRole.entities.AgencyTransfer.filter({
        $or: [{ user_id: account.id }, { from_owner_id: account.id }, { to_owner_id: account.id }],
      }, '-created_date', 200).catch(() => []);
      const mine = (rows || []).filter((row) => row.user_id === account.id);
      const approvals = (rows || []).filter((row) => row.user_id !== account.id && row.status === 'pending');
      return Response.json({ mine, approvals, history: rows || [] });
    }

    // ——— ÜYE KİMLİĞİYLE KULLANICI ARAMA (davet için) ———
    if (action === 'invite-lookup') {
      if (account.agency_role !== 'owner' || !account.agency_record_id) return Response.json({ error: 'Yalnızca ajans sahibi arama yapabilir.' }, { status: 403 });
      const memberId = String(body.member_id || '').trim().replace('#', '');
      if (!memberId) return Response.json({ error: 'Üye kimliği gerekli.' }, { status: 400 });
      const rows = await base44.asServiceRole.entities.User.filter({ member_id: memberId }, '-created_date', 5).catch(() => []);
      const found = (rows || []).find((row) => row.id !== account.id);
      if (!found) return Response.json({ user: null });
      const inSameAgency = found.agency_record_id === account.agency_record_id;
      return Response.json({
        user: {
          id: found.id, name: found.username || found.full_name || 'Kullanıcı', avatar: found.avatar || '',
          member_id: found.member_id || '-', agency_name: inSameAgency ? (found.agency_name || 'Ajansın') : (found.agency_name || ''),
          friend: await isFriendOf(account.id, found.id),
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
          transfers: transfers || [], tiers: tiers || [], rewards: rewards || [],
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
        await base44.asServiceRole.entities.User.update(owner.id, userPatch(agency));
        return Response.json({ ok: true, agency });
      }
      if (action === 'admin-agency-decide') {
        const agency = await base44.asServiceRole.entities.Agency.get(String(body.agency_id || '')).catch(() => null);
        if (!agency) return Response.json({ error: 'Ajans bulunamadı.' }, { status: 404 });
        const owner = await base44.asServiceRole.entities.User.get(agency.owner_id).catch(() => null);
        if (body.approve) {
          await base44.asServiceRole.entities.Agency.update(agency.id, { status: 'active', active: true, reviewed_at: new Date().toISOString() });
          if (owner) {
            await base44.asServiceRole.entities.User.update(owner.id, userPatch({ ...agency, status: 'active' }));
            await notifyUser(base44, {
              user_id: owner.id, type: 'agency_approved', title: '✅ Ajansın onaylandı',
              body: `${agency.name} (${agency.agency_id}) ajansı onaylandı. Artık yayıncı davet edebilirsin.`, link: '/profil',
            }).catch(() => {});
          }
          return Response.json({ ok: true, status: 'active' });
        }
        await base44.asServiceRole.entities.Agency.update(agency.id, { status: 'rejected', active: false, reviewed_at: new Date().toISOString() });
        if (owner && owner.agency_record_id === agency.id) {
          await base44.asServiceRole.entities.User.update(owner.id, {
            agency_code: '', agency_record_id: '', agency_name: '', agency_owner_id: '', agency_role: '', broadcaster_status: '',
          });
          await notifyUser(base44, {
            user_id: owner.id, type: 'agency_rejected', title: '❌ Ajans başvurun reddedildi',
            body: `${agency.name} başvurun onaylanmadı. Dilersen yeniden başvurabilirsin.`, link: '/profil',
          }).catch(() => {});
        }
        return Response.json({ ok: true, status: 'rejected' });
      }
      if (action === 'admin-agency-delete') {
        const agency = await base44.asServiceRole.entities.Agency.get(String(body.agency_id || '')).catch(() => null);
        if (!agency) return Response.json({ error: 'Ajans bulunamadı.' }, { status: 404 });
        const members = await base44.asServiceRole.entities.User.filter({ agency_record_id: agency.id }, '-created_date', 500).catch(() => []);
        for (const member of members || []) {
          await base44.asServiceRole.entities.User.update(member.id, {
            agency_code: '', agency_record_id: '', agency_name: '', agency_owner_id: '', agency_role: '', broadcaster_status: '',
          }).catch(() => {});
        }
        const openInvites = await base44.asServiceRole.entities.AgencyInvite.filter({ agency_record_id: agency.id, status: 'pending' }, '-created_date', 500).catch(() => []);
        for (const invite of openInvites || []) {
          await base44.asServiceRole.entities.AgencyInvite.update(invite.id, { status: 'cancelled' }).catch(() => {});
        }
        await base44.asServiceRole.entities.Agency.delete(agency.id);
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
        await base44.asServiceRole.entities.User.update(owner.id, userPatch({ ...agency, owner_id: owner.id }));
        if (previous && previous !== owner.id) {
          await base44.asServiceRole.entities.User.update(previous, { agency_role: 'broadcaster', broadcaster_status: 'active' }).catch(() => {});
        }
        return Response.json({ ok: true });
      }
      if (action === 'admin-broadcaster-add') {
        const member = body.user_id
          ? await base44.asServiceRole.entities.User.get(String(body.user_id)).catch(() => null)
          : await findUserByMemberId(body.member_id);
        const agency = await base44.asServiceRole.entities.Agency.get(String(body.agency_id || '')).catch(() => null);
        if (!member || !agency) return Response.json({ error: 'Kullanıcı veya ajans bulunamadı.' }, { status: 404 });
        await base44.asServiceRole.entities.User.update(member.id, userPatch({ ...agency, owner_id: agency.owner_id }));
        await refreshAgencyTotals(base44, agency.id).catch(() => {});
        return Response.json({ ok: true });
      }
      if (action === 'admin-broadcaster-remove') {
        const member = await base44.asServiceRole.entities.User.get(String(body.user_id || '')).catch(() => null);
        if (!member) return Response.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
        const agencyId = member.agency_record_id;
        await base44.asServiceRole.entities.User.update(member.id, { agency_code: '', agency_record_id: '', agency_name: '', agency_owner_id: '', agency_role: '', broadcaster_status: '' });
        if (agencyId) await refreshAgencyTotals(base44, agencyId).catch(() => {});
        return Response.json({ ok: true });
      }
      if (action === 'admin-broadcaster-status') {
        const status = body.status === 'active' ? 'active' : 'inactive';
        await base44.asServiceRole.entities.User.update(String(body.user_id || ''), { broadcaster_status: status });
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
        await base44.asServiceRole.entities.QuotaTier.delete(String(body.id || ''));
        return Response.json({ ok: true });
      }
      if (action === 'admin-reward-paid') {
        const paid = body.paid !== false;
        const updated = await base44.asServiceRole.entities.QuotaReward.update(String(body.reward_id || ''), {
          status: paid ? 'paid' : 'pending', paid_at: paid ? new Date().toISOString() : null,
        });
        if (paid) {
          await notifyUser(base44, {
            user_id: updated.user_id, type: 'quota_paid', title: '💸 Ödeme yapıldı',
            body: `$${updated.amount} tutarındaki kota kazancın ödendi olarak işaretlendi.`, link: '/profil',
          }).catch(() => {});
        }
        return Response.json({ ok: true, reward: updated });
      }
      return Response.json({ error: 'Geçersiz admin işlemi.' }, { status: 400 });
    }

    return Response.json({ error: 'Geçersiz işlem.' }, { status: 400 });
  } catch (error) {
    return safeErrorResponse(error);
  }
}