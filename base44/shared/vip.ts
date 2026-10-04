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

/**
 * Otomatik VIP: seviye düşürülmez, kalan sürenin üstüne eklenir ve
 * kişinin çantasına eklendiği bildirimle haber verilir.
 */
export async function grantAutoVip(base44: any, user: { id?: string }, coins: any) {
  if (!user?.id) return null;
  const auto = autoVipForCoins(coins);
  if (!auto) return null;

  const record = await base44.asServiceRole.entities.User.get(user.id).catch(() => null);
  if (!record?.id) return null;

  const level = Math.max(effectiveVipLevel(record), auto.level);
  const currentExpiry = vipExpiryMs(record);
  const base = currentExpiry && currentExpiry > Date.now() ? currentExpiry : Date.now();
  const expiresAt = new Date(base + auto.days * VIP_DAY_MS).toISOString();

  await base44.asServiceRole.entities.User.update(record.id, {
    vip_level: level,
    vip_expires_at: expiresAt,
    vip_source: 'coin',
    vip_granted_at: new Date().toISOString(),
  }).catch(() => {});

  await base44.asServiceRole.entities.Notification.create({
    user_id: record.id,
    title: `VIP${level} çantana eklendi`,
    type: 'vip',
    body: `Coin yüklemen karşılığı VIP${level} çantana eklendi. Süresi: ${vipDurationLabel(auto.days)}.`,
    link: '/profil',
    ref_id: 'coin-load',
  }).catch(() => {});

  return { level, days: auto.days, expires_at: expiresAt };
}