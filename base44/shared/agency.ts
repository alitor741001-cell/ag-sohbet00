import { receivedGiftTotals, giftResetAt, monthStartIso } from './giftBox.ts';
import { notifyUser } from './notifyUser.ts';
import { DEFAULT_QUOTA_TIERS } from './quotaLadder.ts';

/**
 * Yayıncı / ajans sistemi: ajans üyeliği, kota kazançları ve transfer kayıtları.
 * Elmas kaynağı hediye kutusuyla aynıdır (bu ayın elması = aylık hediye puanı).
 */

/** Davet ekranında gösterilen ajans kuralları. */
export const AGENCY_RULES = [
  'Yayıncıların belirlenen yayın kurallarına uyması gerekir.',
  'Kota sistemi elmas üzerinden hesaplanır.',
  'Yayıncıların kazançları tamamlanan kota üzerinden hesaplanır.',
  'Ajans sahibi, ajans bünyesindeki yayıncıların ajans kazancından belirlenen komisyonu alır.',
  'Kazanç/transfer işlemleri sistem kayıtları üzerinden takip edilir.',
  'Kullanıcılar sahte işlem veya hile yapamaz.',
  'Sistem kurallarına aykırı davranılması halinde ajans üyeliği sonlandırılabilir.',
  'Ajans değişikliği yalnızca sistem üzerinden yapılabilir.',
  'Tüm transferler kayıt altına alınır.',
];

/** Her 200.000 elmas için ajans komisyonu (dolar) — ajans bazında değiştirilebilir. */
export const AGENCY_COMMISSION_PER_200K = 3;

/**
 * Sahip olunan ajans alanları: yayıncı üyeliğinden (agency_record_id) ayrı tutulur.
 * Böylece kişi başka bir ajanda yayıncı kalsa da kendi ajansının sahibi olabilir;
 * hediyeleri ve kotası üye olduğu ilk ajansa işlemeye devam eder.
 */
export const ownedAgencyPatch = (agency: any, status = '') => ({
  owned_agency_id: agency?.id || '',
  owned_agency_code: agency?.agency_id || '',
  owned_agency_name: agency?.name || '',
  owned_agency_status: status || agency?.status || '',
});

/** Sahiplik bağlantısını kaldırır; üyelik alanlarına dokunmaz. */
export const clearOwnedAgencyPatch = () => ({
  owned_agency_id: '', owned_agency_code: '', owned_agency_name: '', owned_agency_status: '',
});

/** Elmas miktarına karşılık gelen ajans komisyonu. */
export const agencyCommissionFor = (diamonds: any, per200k: any = AGENCY_COMMISSION_PER_200K) =>
  Math.round((Math.max(0, Number(diamonds) || 0) / 200000) * (Math.max(0, Number(per200k) || 0)) * 100) / 100;

/** Ajansın verebileceği en fazla asistan sayısı. */
export const ASSISTANT_LIMIT = 4;

/** Asistan davetinin geçerlilik süresi (gün). */
export const ASSISTANT_INVITE_DAYS = 7;

/** Ajans sahibinin asistanlık için verebileceği yüzdeler. */
export const ASSISTANT_SHARES = [100, 75, 50, 25];

/** Asistanın payı: ajans komisyonunun verilen yüzde kadarı. */
export const assistantCut = (agencyAmount: any, share: any) =>
  Math.round(((Math.max(0, Number(agencyAmount) || 0) * Math.max(0, Number(share) || 0)) / 100) * 100) / 100;

/** Asistan davetinin son geçerlilik anı. */
export const assistantInviteExpiry = (from: Date = new Date()) =>
  new Date(from.getTime() + ASSISTANT_INVITE_DAYS * 86400000).toISOString();

/** Asistan davet metni: davet edilen kişinin mesajına gönderilir. */
export function assistantInviteText({ ownerName, ownerMemberId, agencyName, agencyId, share }: any) {
  return [
    `👑🗿${ownerName}🪪🪽(${ownerMemberId}) sizi kendi ajansı ${agencyName}(${agencyId}) için ajans yardımcısı olmaya davet ediyor.`,
    `Davet ettiğiniz yayıncılarda gerçekleşen ajans komisyonun ${share}% kadarını sizinle paylaşmaktan mutluluk duyacaklar. Bu daveti kabul ettiğinizde, onların ajansına katılacaksınız.`,
    `Ajans davetiyelerini doğrudan yayıncılara gönderebilir ve uygulamada davet ettiğiniz tüm yayıncıları görüntüleyebilirsiniz; davet ettiğiniz yayıncılar tarafından oluşturulan ajans komisyonlarının ${share}% kadarı otomatik olarak hesabınıza gönderilecektir.`,
    `Bu daveti ${ASSISTANT_INVITE_DAYS} gün sonra artık kabul edemeyeceğiniz için lütfen kısa süre içinde değerlendirin.`,
  ].join(' ');
}

/** Ajansın aktif asistanı (yüzdelik payıyla). */
export const activeAssistant = (agency: any, userId: string) =>
  (agency?.assistants || []).find((row: any) => row.user_id === userId && row.status === 'active') || null;

/**
 * Kişinin asistanlığını sona erdirir: ajans kaydındaki asistan satırı kapatılır.
 * Ajansın kendi üyesiyse üyeliği korunur ve rolü yayıncıya döner; dışarıdan
 * asistan olarak katıldıysa ajans bağı tümüyle kaldırılır.
 * Ban, hesap kapatma ve yönetici onaylı normal transferde kullanılır.
 */
export async function detachAssistant(base44: any, userId: string) {
  const account = await base44.asServiceRole.entities.User.get(userId).catch(() => null);
  if (!account?.agency_record_id || account.agency_role !== 'assistant') return false;
  const agency = await base44.asServiceRole.entities.Agency.get(account.agency_record_id).catch(() => null);
  if (!agency) return false;
  const entry = (agency.assistants || []).find((row: any) => row.user_id === userId) || null;
  const assistants = (agency.assistants || []).map((row: any) => (row.user_id === userId ? { ...row, status: 'removed' } : row));
  await base44.asServiceRole.entities.Agency.update(agency.id, { assistants }).catch(() => {});
  if (entry?.invite_id && entry.status === 'invited') {
    await base44.asServiceRole.entities.AgencyInvite
      .update(entry.invite_id, { status: 'cancelled', responded_at: new Date().toISOString() }).catch(() => {});
  }
  await base44.asServiceRole.entities.User.update(userId, entry?.from_agency
    ? { agency_role: 'broadcaster' }
    : { agency_code: '', agency_record_id: '', agency_name: '', agency_owner_id: '', agency_role: '', broadcaster_status: '' }).catch(() => {});
  return true;
}

/** Serbest bırakılan üyede ajans bağlantısının tamamı temizlenir. */
const RELEASED_MEMBER_PATCH = {
  agency_code: '', agency_record_id: '', agency_name: '', agency_owner_id: '', agency_role: '', broadcaster_status: '',
};

/**
 * Anormal transfer: ajans sahibi engellendiğinde ajans kapanır ve bütün üyeler
 * kendiliğinden serbest bırakılır — sahip ya da yönetici onayı beklenmez.
 * Üyeler bağlantısız kalır ve serbestçe yeni bir ajansa başvurabilir.
 */
export async function releaseAgencyMembers(base44: any, agency: any, reason = '') {
  if (!agency?.id) return 0;
  const members = await base44.asServiceRole.entities.User
    .filter({ agency_record_id: agency.id }, '-created_date', 500).catch(() => []);
  // Asistan satırları ve bekleyen davetler kapanır: ölü ajansa davet gitmez.
  const assistants = (agency.assistants || []).map((row: any) =>
    (row.status === 'active' || row.status === 'invited' ? { ...row, status: 'removed' } : row));
  await base44.asServiceRole.entities.Agency.update(agency.id, { active: false, assistants }).catch(() => {});
  const invites = await base44.asServiceRole.entities.AgencyInvite
    .filter({ agency_record_id: agency.id, status: 'pending' }, '-created_date', 200).catch(() => []);
  await Promise.all((invites || []).map((invite: any) => base44.asServiceRole.entities.AgencyInvite
    .update(invite.id, { status: 'cancelled', responded_at: new Date().toISOString() }).catch(() => {})));
  for (const member of members || []) {
    await base44.asServiceRole.entities.User.update(member.id, RELEASED_MEMBER_PATCH).catch(() => {});
    await notifyUser(base44, {
      user_id: member.id, type: 'agency_transfer', title: '⚠️ Anormal transfer',
      body: `${agency.name || 'Ajans'} ajansının sahibi engellendiği için ajans bağlantın kaldırıldı. Yeni bir ajansa başvurabilirsin.${reason ? ` Not: ${reason}` : ''}`,
      link: '/ajans',
    }).catch(() => {});
  }
  await refreshAgencyTotals(base44, agency.id).catch(() => {});
  return (members || []).length;
}

/** Yayıncıyı ajansa kazandıran asistan: kabul edilmiş davetten bulunur. */
export async function broadcasterAssistantLink(base44: any, userId: string, agencyId: string) {
  const rows = await base44.asServiceRole.entities.AgencyInvite
    .filter({ invitee_id: userId, status: 'accepted' }, '-created_date', 20).catch(() => []);
  return (rows || []).find((row: any) => row.assistant_id && row.agency_record_id === agencyId && row.kind !== 'assistant') || null;
}

/** Süresi dolmuş asistan davetlerini kapatır (7 gün sonra kabul edilemez). */
export async function expireAssistantInvites(base44: any, agency: any) {
  const now = Date.now();
  const assistants = agency?.assistants || [];
  const stale = assistants.filter((row: any) => row.status === 'invited' && row.expires_at && new Date(row.expires_at).getTime() < now);
  if (!stale.length) return;
  const patched = assistants.map((row: any) => (stale.some((item: any) => item.user_id === row.user_id) ? { ...row, status: 'expired' } : row));
  await base44.asServiceRole.entities.Agency.update(agency.id, { assistants: patched }).catch(() => {});
  for (const row of stale) {
    if (row.invite_id) {
      await base44.asServiceRole.entities.AgencyInvite.update(row.invite_id, { status: 'expired' }).catch(() => {});
    }
  }
}

/** Benzersiz ajans kimliği: AG-482917 */
export function generateAgencyCode() {
  return `AG-${Math.floor(100000 + Math.random() * 900000)}`;
}

const round = (value: any) => Math.round((Number(value) || 0) * 100) / 100;

/**
 * Kota tablosu boşsa varsayılan kademeleri yazar (admin panelinden düzenlenebilir).
 * Aynı elmas seviyesinde mükerrer kademe oluşmuşsa seviye başına tek kayıt tutulur ve
 * fazlalıklar silinir; aksi halde aynı kota için birden fazla ödeme işlenirdi.
 */
export async function ensureQuotaTiers(base44: any) {
  const existing = await base44.asServiceRole.entities.QuotaTier.filter({}, 'sort_order', 500).catch(() => []);
  if (!existing.length) {
    await base44.asServiceRole.entities.QuotaTier.bulkCreate(DEFAULT_QUOTA_TIERS.map(([diamonds, dollars], index) => ({
      diamonds, broadcaster_dollars: dollars, agency_dollars: agencyCommissionFor(diamonds), active: true, sort_order: index + 1,
    }))).catch(() => {});
    return base44.asServiceRole.entities.QuotaTier.filter({}, 'sort_order', 500).catch(() => []);
  }
  const byLevel = new Map<number, any>();
  const extra: any[] = [];
  existing.forEach((tier: any) => {
    const level = Number(tier.diamonds) || 0;
    const current = byLevel.get(level);
    if (!current) { byLevel.set(level, tier); return; }
    // Aktif kademe tercih edilir, diğerleri mükerrerdir.
    if (current.active === false && tier.active !== false) { extra.push(current); byLevel.set(level, tier); return; }
    extra.push(tier);
  });
  if (extra.length) {
    await Promise.all(extra.map((tier: any) => base44.asServiceRole.entities.QuotaTier.delete(tier.id).catch(() => {})));
  }
  return [...byLevel.values()];
}

/** Kişinin bu ayki ve tüm zamanların elması (ödeme kuralından bağımsız, ham elmas). */
export async function broadcasterDiamonds(base44: any, userId: string) {
  const resetAt = await giftResetAt(base44);
  const totals = await receivedGiftTotals(base44, userId, resetAt);
  return { month: Math.round(Number(totals.month_score) || 0), total: Math.round((Number(totals.k) || 0) * 1000) };
}

/** Ay anahtarı (YYYY-MM, Türkiye saatiyle) — kota tamamlanmaları ay bazlı işlenir. */
export function periodKey(now = new Date()) {
  return monthStartIso(now).slice(0, 7);
}

/** Gün anahtarı (YYYY-MM-DD, Türkiye saatiyle). */
export function todayKey(date: Date = new Date()) {
  return date.toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
}

/**
 * Tamamlanan kotaları ödüllendirir. Aynı kota (kişi + kademe + ay) ikinci kez ödenmez:
 * kayıt varsa atlanır. Hediye geldiğinde ve paneller açıldığında çalışır.
 */
const QUOTA_SCAN_WINDOW_MS = 30000;

/**
 * Aynı kişinin elması 30 saniyede bir taranır: profil açılırken üst üste gelen
 * çağrılar (özet + yayıncı paneli) aynı taramayı tekrarlayıp bölümü bekletmez.
 * Damga her durumda yazılır; okuma başarısız olursa tarama yine yapılır.
 */
async function quotaScanRecent(base44: any, userId: string) {
  const key = `quota-scan:${userId}`;
  const rows = await base44.asServiceRole.entities.RateLimit.filter({ key }).catch(() => []);
  const at = rows?.[0]?.window_start ? new Date(rows[0].window_start).getTime() : 0;
  if (at && Date.now() - at < QUOTA_SCAN_WINDOW_MS) return true;
  const stamp = new Date().toISOString();
  if (rows?.[0]) {
    await base44.asServiceRole.entities.RateLimit.update(rows[0].id, { count: 1, window_start: stamp }).catch(() => {});
  } else {
    await base44.asServiceRole.entities.RateLimit.create({ key, user_id: userId, count: 1, window_start: stamp }).catch(() => {});
  }
  return false;
}

export async function syncQuotaRewards(base44: any, userId: string) {
  const account = await base44.asServiceRole.entities.User.get(userId).catch(() => null);
  if (!account || account.broadcaster_status !== 'active') return { awarded: [] as any[] };
  // Az önce tarandıysa tekrar taranmaz: kota kazançları o taramada yazılmıştır.
  if (await quotaScanRecent(base44, userId)) return { awarded: [] as any[] };
  const { month } = await broadcasterDiamonds(base44, userId);
  const period = periodKey();
  if (Number(account.diamond_month) !== month || account.diamond_month_period !== period) {
    await base44.asServiceRole.entities.User.update(userId, { diamond_month: month, diamond_month_period: period }).catch(() => {});
  }
  const tiers = await ensureQuotaTiers(base44);
  const eligible = tiers.filter((tier) => tier.active !== false && Number(tier.diamonds || 0) <= month);
  if (!eligible.length) return { awarded: [] as any[] };
  // Yayıncıyı ajansa kazandıran asistan varsa, komisyonun yüzdelik payı ona da yazılır.
  const ownerAgency = account.agency_record_id
    ? await base44.asServiceRole.entities.Agency.get(account.agency_record_id).catch(() => null)
    : null;
  const assistantLink = ownerAgency ? await broadcasterAssistantLink(base44, userId, ownerAgency.id) : null;
  const assistant = assistantLink ? activeAssistant(ownerAgency, assistantLink.assistant_id) : null;
  // Aynı kota (kişi + kademe seviyesi + ay) ikinci kez ödenmez: kontrol kademe seviyesi üzerinden yapılır.
  const existing = await base44.asServiceRole.entities.QuotaReward.filter({ user_id: userId, period }, '-created_date', 500).catch(() => []);
  const done = new Set(existing.map((row) => Number(row.diamonds) || 0));
  const name = account.username || account.full_name || 'Yayıncı';
  const awarded = [];
  for (const tier of eligible) {
    if (done.has(Number(tier.diamonds) || 0)) continue;
    const reward = await base44.asServiceRole.entities.QuotaReward.create({
      user_id: userId, user_name: name,
      agency_id: account.agency_record_id || '', agency_code: account.agency_code || '', agency_name: account.agency_name || '',
      agency_owner_id: account.agency_owner_id || '', period, tier_id: tier.id,
      diamonds: Number(tier.diamonds) || 0, amount: round(tier.broadcaster_dollars),
      agency_amount: round(tier.agency_dollars) || agencyCommissionFor(tier.diamonds),
      // Kota tamamlandığı anda kayıt ödendi sayılır: panelde ayrıca işaretlemek gerekmez.
      status: 'paid', paid_at: new Date().toISOString(),
      transaction_id: `Q-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      completed_at: new Date().toISOString(),
    }).catch(() => null);
    if (!reward) continue;
    awarded.push(reward);
    await notifyUser(base44, {
      user_id: userId, type: 'quota_reward',
      title: '🎉 Kota tamamlandı!',
      body: `${Number(tier.diamonds).toLocaleString('tr-TR')} elmas kotası tamamlandı • +$${reward.amount} kazancına eklendi.`,
      link: '/profil',
    }).catch(() => {});
    if (reward.agency_owner_id) {
      await notifyUser(base44, {
        user_id: reward.agency_owner_id, type: 'agency_commission',
        title: '💎 Ajans kazancı',
        body: `${name}, ${Number(tier.diamonds).toLocaleString('tr-TR')} elmas kotasını tamamladı • ajansına +$${reward.agency_amount} yazıldı.`,
        link: '/profil',
      }).catch(() => {});
    }
    if (assistant) {
      const cut = assistantCut(reward.agency_amount, assistant.share);
      if (cut > 0) {
        await base44.asServiceRole.entities.QuotaReward.create({
          kind: 'assistant', user_id: assistant.user_id, user_name: assistant.name || 'Asistan',
          assistant_id: assistant.user_id, assistant_name: assistant.name || 'Asistan', assistant_amount: cut,
          agency_id: reward.agency_id, agency_code: reward.agency_code, agency_name: reward.agency_name,
          agency_owner_id: reward.agency_owner_id, period, tier_id: tier.id,
          diamonds: Number(tier.diamonds) || 0, amount: cut, agency_amount: 0, status: 'paid', paid_at: new Date().toISOString(),
          transaction_id: `A-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          completed_at: new Date().toISOString(),
        }).catch(() => null);
        await notifyUser(base44, {
          user_id: assistant.user_id, type: 'assistant_commission',
          title: '💰 Asistan kazancı',
          body: `${name}, ${Number(tier.diamonds).toLocaleString('tr-TR')} elmas kotasını tamamladı • asistanlık payın +$${cut} hesabına yazıldı.`,
          link: '/ajans/kazanc',
        }).catch(() => {});
      }
    }
  }
  if (awarded.length && account.agency_record_id) await refreshAgencyTotals(base44, account.agency_record_id);
  return { awarded };
}

/** Ajans sayaçlarını üyelerinden yeniden hesaplar (yayıncı sayısı, elmas, komisyon toplamı). */
export async function refreshAgencyTotals(base44: any, agencyId: string) {
  if (!agencyId) return null;
  const agency = await base44.asServiceRole.entities.Agency.get(agencyId).catch(() => null);
  if (!agency) return null;
  const [members, rewards] = await Promise.all([
    base44.asServiceRole.entities.User.filter({ agency_record_id: agencyId }, '-created_date', 500).catch(() => []),
    base44.asServiceRole.entities.QuotaReward.filter({ agency_id: agencyId }, '-created_date', 1000).catch(() => []),
  ]);
  const broadcasters = (members || []).filter((member: any) => member.agency_role === 'broadcaster');
  const patch = {
    member_count: broadcasters.length,
    total_diamonds: broadcasters.reduce((sum: number, member: any) => sum + Math.round((Number(member.gift_received_k) || 0) * 1000), 0),
    month_diamonds: broadcasters.reduce((sum: number, member: any) => sum + (Number(member.diamond_month) || 0), 0),
    total_earnings: round((rewards || []).reduce((sum: number, row: any) => sum + (Number(row.agency_amount) || 0), 0)),
  };
  await base44.asServiceRole.entities.Agency.update(agencyId, patch).catch(() => {});
  return { ...agency, ...patch };
}

/** Ajans paneli verisi: üyeler, kazançları, bekleyen davetler ve transferler. */
export async function agencyStats(base44: any, agency: any) {
  // Süresi dolan asistan davetleri panel açılışında kapatılır.
  await expireAssistantInvites(base44, agency).catch(() => {});
  const period = periodKey();
  const today = todayKey();
  const [members, rewards, invites, transfers, tiers, acceptedInvites] = await Promise.all([
    base44.asServiceRole.entities.User.filter({ agency_record_id: agency.id }, '-created_date', 500).catch(() => []),
    base44.asServiceRole.entities.QuotaReward.filter({ agency_id: agency.id }, '-created_date', 1000).catch(() => []),
    base44.asServiceRole.entities.AgencyInvite.filter({ agency_record_id: agency.id, status: 'pending' }, '-created_date', 200).catch(() => []),
    base44.asServiceRole.entities.AgencyTransfer.filter({ $or: [{ from_agency_id: agency.id }, { to_agency_id: agency.id }] }, '-created_date', 200).catch(() => []),
    ensureQuotaTiers(base44),
    base44.asServiceRole.entities.AgencyInvite.filter({ agency_record_id: agency.id, status: 'accepted' }, '-created_date', 500).catch(() => []),
  ]);
  const broadcasters = (members || []).filter((member: any) => member.agency_role === 'broadcaster');
  const activeTiers = (tiers || []).filter((tier: any) => tier.active !== false);
  const rows = broadcasters.map((member: any) => {
    const own = (rewards || []).filter((row: any) => row.user_id === member.id);
    const mine = own.filter((row: any) => row.period === period);
    const monthElmas = Number(member.diamond_month) || 0;
    const nextTier = activeTiers.find((tier: any) => Number(tier.diamonds) > monthElmas) || null;
    return {
      user_id: member.id,
      name: member.username || member.full_name || 'Yayıncı',
      avatar: member.avatar || '',
      member_id: member.member_id || '-',
      diamonds: monthElmas,
      total_diamonds: Math.round((Number(member.gift_received_k) || 0) * 1000),
      quota: mine.reduce((max: number, row: any) => Math.max(max, Number(row.diamonds) || 0), 0),
      next_quota: Number(nextTier?.diamonds) || 0,
      month_commission: round(mine.reduce((sum: number, row: any) => sum + (Number(row.agency_amount) || 0), 0)),
      earnings: round(own.reduce((sum: number, row: any) => sum + (Number(row.amount) || 0), 0)),
      pending: round(own.filter((row: any) => row.status !== 'paid').reduce((sum: number, row: any) => sum + (Number(row.amount) || 0), 0)),
      status: member.broadcaster_status === 'active' ? 'active' : 'inactive',
      joined: member.created_date || null,
    };
  }).sort((a: any, b: any) => b.diamonds - a.diamonds);
  // Asistanlar: yayıncıyı kim davet ettiyse o asistanın yayıncısıdır.
  const linkByInvitee = new Map<string, any>((acceptedInvites || []).map((row: any) => [row.invitee_id, row]));
  const rowsWithAssistant = rows.map((row: any) => {
    const link = linkByInvitee.get(row.user_id);
    const owned = link && link.kind !== 'assistant' && link.assistant_id;
    return { ...row, assistant_id: owned ? link.assistant_id : '', assistant_name: owned ? (link.assistant_name || '') : '' };
  });
  const assistantRows = (agency.assistants || [])
    .filter((entry: any) => entry.status !== 'removed')
    .map((entry: any) => ({
      user_id: entry.user_id, name: entry.name || 'Asistan', avatar: entry.avatar || '', member_id: entry.member_id || '-',
      share: Number(entry.share) || 0, status: entry.status || 'invited',
      invited_at: entry.invited_at || '', expires_at: entry.expires_at || '', accepted_at: entry.accepted_at || '',
      members: rowsWithAssistant.filter((row: any) => row.assistant_id === entry.user_id),
      broadcaster_count: rowsWithAssistant.filter((row: any) => row.assistant_id === entry.user_id).length,
      earnings: round((rewards || []).filter((row: any) => row.kind === 'assistant' && row.user_id === entry.user_id).reduce((sum: number, row: any) => sum + (Number(row.amount) || 0), 0)),
    }));
  const agencyEarnings = (rewards || []).reduce((sum: number, row: any) => sum + (Number(row.agency_amount) || 0), 0);
  return {
    agency: {
      id: agency.id, agency_id: agency.agency_id, name: agency.name, description: agency.description || '',
      logo: agency.logo || '', rules: agency.rules || AGENCY_RULES.join('\n'), owner_id: agency.owner_id,
      owner_name: agency.owner_name || '', owner_avatar: agency.owner_avatar || '',
      commission_per_200k: Number(agency.commission_per_200k) || AGENCY_COMMISSION_PER_200K,
      total_diamonds: broadcasters.reduce((sum: number, member: any) => sum + Math.round((Number(member.gift_received_k) || 0) * 1000), 0),
      month_diamonds: broadcasters.reduce((sum: number, member: any) => sum + (Number(member.diamond_month) || 0), 0),
      total_earnings: round(agencyEarnings),
      month_earnings: round((rewards || []).filter((row: any) => row.period === period).reduce((sum: number, row: any) => sum + (Number(row.agency_amount) || 0), 0)),
      today_earnings: round((rewards || []).filter((row: any) => todayKey(new Date(row.created_date || 0)) === today).reduce((sum: number, row: any) => sum + (Number(row.agency_amount) || 0), 0)),
      member_count: broadcasters.length,
      active_count: rows.filter((row: any) => row.status === 'active').length,
    },
    members: rowsWithAssistant,
    assistants: assistantRows,
    invites: invites || [],
    transfers: transfers || [],
    tiers: tiers || [],
  };
}

/** Sohbet kaydı bul, yoksa oluştur — sistem mesajları için ortak yol. */
export async function findConversation(base44: any, aId: string, bId: string) {
  const rows = await base44.asServiceRole.entities.Conversation.filter({
    $or: [{ user1_id: aId, user2_id: bId }, { user1_id: bId, user2_id: aId }],
  }, '-created_date', 1).catch(() => []);
  return rows?.[0] || null;
}

/** Bir kullanıcıdan diğerine sohbet mesajı gönderir (davet kartı da bu yolu kullanır). */
export async function sendDirect(base44: any, sender: any, receiver: any, content: string) {
  const senderName = sender.username || sender.full_name || 'Kullanıcı';
  const receiverId = receiver.id;
  let conversation = await findConversation(base44, sender.id, receiverId);
  if (!conversation) {
    conversation = await base44.asServiceRole.entities.Conversation.create({
      user1_id: sender.id, user1_name: senderName, user1_avatar: sender.avatar || '',
      user2_id: receiverId, user2_name: receiver.username || receiver.full_name || 'Kullanıcı', user2_avatar: receiver.avatar || '',
      members: [sender.id, receiverId], deleted_for: [], unread_user1: 0, unread_user2: 0,
    });
  }
  const message = await base44.asServiceRole.entities.ChatMessage.create({
    conversation_id: conversation.id, sender_id: sender.id, sender_name: senderName,
    receiver_id: receiverId, content, deleted_for: [], read_by: [sender.id],
  });
  const unreadKey = conversation.user1_id === sender.id ? 'unread_user2' : 'unread_user1';
  await base44.asServiceRole.entities.Conversation.update(conversation.id, {
    deleted_for: (conversation.deleted_for || []).filter((id: string) => id !== receiverId),
    last_message_text: content, last_message_at: new Date().toISOString(),
    last_sender_id: sender.id, last_sender_name: senderName,
    [unreadKey]: (Number(conversation[unreadKey]) || 0) + 1,
  }).catch(() => {});
  return { conversation, message };
}

/** Sohbette özel davet kartı olarak görünen işaret. */
export const inviteMarker = (inviteId: string) => `{{AGENCY_INVITE|${inviteId}}}`;

/** Bildirim kaydındaki davet referansı — bildirimden kabul/red için kullanılır. */
export const inviteRefId = (inviteId: string) => `agency-invite:${inviteId}`;