/**
 * VIP: seviye, süre ve otomatik atama kuralları.
 * - Yönetici, VIP Merkezi'nden seçtiği süre kadar VIP verir (1 hafta / 15 gün / 1 ay).
 * - Coin yüklemesi VIP'i otomatik çantaya ekler:
 *   1M+ coin → rastgele VIP5–VIP9 (1 hafta), 3M+ → VIP10 (15 gün),
 *   5M+ → VIP11 (1 ay), 10M+ → VIP12 (1 ay).
 * - Süre dolduğunda rozet kendiliğinden düşer (bitiş tarihi geçmişse VIP sayılmaz).
 */

export const VIP_MIN = 0;
export const VIP_MAX = 12;

/** Gizli kullanıcı modunun gerektirdiği en düşük VIP seviyesi. */
export const HIDDEN_REQUIRED_VIP = 10;
/** Gizli kullanıcının odalarda görünen takma adı — kimlik bilgisi taşımaz. */
export const HIDDEN_DISPLAY_NAME = 'Gizli Kullanıcı';

export const VIP_DAY_MS = 24 * 60 * 60 * 1000;

// Otomatik kurada en düşük VIP seviyesi — VIP özellikleri 5'ten başlar.
const VIP_AUTO_MIN_LEVEL = 5;

export const VIP_DURATIONS: Record<string, number> = { week: 7, half: 15, month: 30 };

export const vipDurationLabel = (days: any) => {
  const value = Math.max(0, Math.floor(Number(days) || 0));
  if (value === 7) return '1 hafta';
  if (value === 15) return '15 gün';
  if (value === 30) return '1 ay';
  return `${value} gün`;
};

export const vipExpiryMs = (user: any): number | null => {
  const expiry = Date.parse(String(user?.vip_expires_at || ''));
  return Number.isNaN(expiry) ? null : expiry;
};

/** Bitiş tarihi yazılmamış kayıtlar (eski VIP'ler) süresiz sayılır. */
export const vipActive = (user: any) => {
  const expiry = vipExpiryMs(user);
  return expiry === null || expiry > Date.now();
};

export const effectiveVipLevel = (user: any) => {
  const level = Math.min(VIP_MAX, Math.max(VIP_MIN, Math.floor(Number(user?.vip_level) || 0)));
  return vipActive(user) ? level : 0;
};

/** Gizli kullanıcı modu açık ve VIP seviyesi yeterliyse kişi odalarda kimliğini göstermez. */
export const isHiddenUser = (user: any) => !!user?.hidden_user && effectiveVipLevel(user) >= HIDDEN_REQUIRED_VIP;

/** Kalan gün: süresiz VIP'de null döner. */
export const vipDaysLeft = (user: any) => {
  const expiry = vipExpiryMs(user);
  if (expiry === null || expiry <= Date.now()) return null;
  return Math.max(0, Math.ceil((expiry - Date.now()) / VIP_DAY_MS));
};

/** Yüklenen coin karşılığı otomatik VIP: seviye + süre (eşiğin altındaysa null). */
export const autoVipForCoins = (coins: any) => {
  const amount = Math.floor(Number(coins) || 0);
  if (amount >= 10000000) return { level: 12, days: VIP_DURATIONS.month };
  if (amount >= 5000000) return { level: 11, days: VIP_DURATIONS.month };
  if (amount >= 3000000) return { level: 10, days: VIP_DURATIONS.half };
  if (amount >= 1000000) {
    const span = 9 - VIP_AUTO_MIN_LEVEL + 1;
    return { level: VIP_AUTO_MIN_LEVEL + Math.floor(Math.random() * span), days: VIP_DURATIONS.week };
  }
  return null;
};

/** VIP'i kişinin profiline işler; kalan sürenin üstüne ekler (kendisi kullanınca da buradan geçer). */
export async function applyVipToUser(base44: any, target: any, level: any, days: any, extra: Record<string, any> = {}) {
  if (!target?.id) return null;
  const value = Math.min(VIP_MAX, Math.max(VIP_MIN, Math.floor(Number(level) || 0)));
  const duration = Math.max(0, Math.floor(Number(days) || 0));
  const currentExpiry = vipExpiryMs(target);
  const base = value > 0 && vipActive(target) && currentExpiry ? currentExpiry : Date.now();
  const expiresAt = value > 0 && duration > 0 ? new Date(base + duration * VIP_DAY_MS).toISOString() : '';

  await base44.asServiceRole.entities.User.update(target.id, {
    vip_level: value,
    vip_expires_at: expiresAt,
    ...extra,
  }).catch(() => {});

  return { level: value, expires_at: expiresAt };
}

/** VIP'i mavi çantaya bırakır: kişi isterse kendisi kullanır, isterse kimlik numarasıyla gönderir. */
export async function addVipToBag(base44: any, { owner, level, days, source = 'coin', sender = null }: any) {
  if (!owner?.id) return null;
  return base44.asServiceRole.entities.VipItem.create({
    owner_id: owner.id,
    owner_name: owner.username || owner.full_name || 'Kullanıcı',
    level: Math.min(VIP_MAX, Math.max(VIP_MIN, Math.floor(Number(level) || 0))),
    days: Math.max(1, Math.floor(Number(days) || 0)),
    source,
    status: 'bag',
    sender_id: sender?.id || '',
    sender_name: sender?.name || '',
  }).catch(() => null);
}

/**
 * Coin yüklemesinden gelen VIP profile doğrudan işlenmez, mavi çantaya bırakılır.
 * Kişiye çantasına VIP geldiğini haber veren bildirim düşer.
 */
export async function grantAutoVip(base44: any, user: { id?: string }, coins: any) {
  if (!user?.id) return null;
  const auto = autoVipForCoins(coins);
  if (!auto) return null;

  const record = await base44.asServiceRole.entities.User.get(user.id).catch(() => null);
  if (!record?.id) return null;

  const item = await addVipToBag(base44, { owner: record, level: auto.level, days: auto.days, source: 'coin' });
  if (!item) return null;

  await base44.asServiceRole.entities.Notification.create({
    user_id: record.id,
    title: `VIP${auto.level} mavi çantanda`,
    type: 'vip',
    body: `Coin yüklemen karşılığı VIP${auto.level} (${vipDurationLabel(auto.days)}) mavi çantana geldi. İstersen kendin kullan, istersen kimlik numarasıyla bir arkadaşına gönder.`,
    link: '/profil',
    ref_id: 'coin-load',
  }).catch(() => {});

  return { level: auto.level, days: auto.days };
}