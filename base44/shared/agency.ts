import { receivedGiftTotals, giftResetAt, monthStartIso } from './giftBox.ts';
import { notifyUser } from './notifyUser.ts';

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

/** Kota tablosunun başlangıç değerleri: [elmas, yayıncı kazancı]. */
export const DEFAULT_QUOTA_TIERS: [number, number][] = [
  [200000, 15], [300000, 23], [500000, 39], [800000, 60], [1200000, 86], [1600000, 104],
  [2200000, 132], [2800000, 168], [3600000, 216], [5000000, 300], [6250000, 375], [7500000, 470],
  [10000000, 630], [12500000, 790], [15000000, 950], [20000000, 1350], [25000000, 1688],
  [30000000, 2025], [35000000, 2362], [40000000, 2700], [45000000, 3038], [50000000, 3375],
  [75000000, 5062], [100000000, 6750], [125000000, 8438], [150000000, 10125], [200000000, 13500],
  [250000000, 16875],
];

/** Elmas miktarına karşılık gelen ajans komisyonu. */
export const agencyCommissionFor = (diamonds: any, per200k: any = AGENCY_COMMISSION_PER_200K) =>
  Math.round((Math.max(0, Number(diamonds) || 0) / 200000) * (Math.max(0, Number(per200k) || 0)) * 100) / 100;

/** Benzersiz ajans kimliği: AG-482917 */
export function generateAgencyCode() {
  return `AG-${Math.floor(100000 + Math.random() * 900000)}`;
}

const round = (value: any) => Math.round((Number(value) || 0) * 100) / 100;

/** Kota tablosu boşsa varsayılan kademeleri yazar (admin panelinden düzenlenebilir). */
export async function ensureQuotaTiers(base44: any) {
  const existing = await base44.asServiceRole.entities.QuotaTier.filter({}, 'sort_order', 500).catch(() => []);
  if (existing.length) return existing;
  await base44.asServiceRole.entities.QuotaTier.bulkCreate(DEFAULT_QUOTA_TIERS.map(([diamonds, dollars], index) => ({
    diamonds, broadcaster_dollars: dollars, agency_dollars: agencyCommissionFor(diamonds), active: true, sort_order: index + 1,
  }))).catch(() => {});
  return base44.asServiceRole.entities.QuotaTier.filter({}, 'sort_order', 500).catch(() => []);
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
export async function syncQuotaRewards(base44: any, userId: string) {
  const account = await base44.asServiceRole.entities.User.get(userId).catch(() => null);
  if (!account || account.broadcaster_status !== 'active') return { awarded: [] as any[] };
  const { month } = await broadcasterDiamonds(base44, userId);
  const period = periodKey();
  if (Number(account.diamond_month) !== month || account.diamond_month_period !== period) {
    await base44.asServiceRole.entities.User.update(userId, { diamond_month: month, diamond_month_period: period }).catch(() => {});
  }
  const tiers = await ensureQuotaTiers(base44);
  const eligible = tiers.filter((tier) => tier.active !== false && Number(tier.diamonds || 0) <= month);
  if (!eligible.length) return { awarded: [] as any[] };
  const existing = await base44.asServiceRole.entities.QuotaReward.filter({ user_id: userId, period }, '-created_date', 500).catch(() => []);
  const done = new Set(existing.map((row) => row.tier_id));
  const name = account.username || account.full_name || 'Yayıncı';
  const awarded = [];
  for (const tier of eligible) {
    if (done.has(tier.id)) continue;
    const reward = await base44.asServiceRole.entities.QuotaReward.create({
      user_id: userId, user_name: name,
      agency_id: account.agency_record_id || '', agency_code: account.agency_code || '', agency_name: account.agency_name || '',
      agency_owner_id: account.agency_owner_id || '', period, tier_id: tier.id,
      diamonds: Number(tier.diamonds) || 0, amount: round(tier.broadcaster_dollars),
      agency_amount: round(tier.agency_dollars) || agencyCommissionFor(tier.diamonds),
      status: 'pending', transaction_id: `Q-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
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
  const period = periodKey();
  const today = todayKey();
  const [members, rewards, invites, transfers, tiers] = await Promise.all([
    base44.asServiceRole.entities.User.filter({ agency_record_id: agency.id }, '-created_date', 500).catch(() => []),
    base44.asServiceRole.entities.QuotaReward.filter({ agency_id: agency.id }, '-created_date', 1000).catch(() => []),
    base44.asServiceRole.entities.AgencyInvite.filter({ agency_record_id: agency.id, status: 'pending' }, '-created_date', 200).catch(() => []),
    base44.asServiceRole.entities.AgencyTransfer.filter({ $or: [{ from_agency_id: agency.id }, { to_agency_id: agency.id }] }, '-created_date', 200).catch(() => []),
    ensureQuotaTiers(base44),
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
    members: rows,
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