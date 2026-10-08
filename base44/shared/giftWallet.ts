/**
 * Hediye K sistemi: bakiye slot cüzdanıdır (1 K = 1.000 coin).
 * Sesli oda fonksiyonu hediye gönderiminde ve bakiye sorgusunda kullanır.
 */

export const START_COINS = 100000;
export const ADMIN_COINS = 500000;
export const K_UNIT = 1000;
// Eski "sınırsız" bakiyeler tek seferde normale çekilir.
const LEGACY_MAX_COINS = 100000000;

/** K değerinin coin karşılığı — 1K altındaki hediyeler de doğru hesaplanır (0,05K = 50 coin). */
export const coinsForK = (kValue: any) => Math.max(0, Math.round((Number(kValue) || 0) * K_UNIT));

/** K değerini okunur biçime çevirir: 500 → "500K", 0,05 → "0,05K". */
export function formatK(kValue: any) {
  const raw = Math.max(0, Number(kValue) || 0);
  if (raw > 0 && raw < 1) return `${(Math.round(raw * K_UNIT) / K_UNIT).toLocaleString('tr-TR')}K`;
  return `${Math.round(raw).toLocaleString('tr-TR')}K`;
}

/** Kişinin K bakiyesi (coin) — kayıt yoksa varsayılan bakiye döner. */
export async function giftBalance(base44: any, user: any) {
  const found = await base44.asServiceRole.entities.GameWallet.filter({ user_id: user.id }, '-created_date', 1);
  if (found[0]) return Math.max(0, Number(found[0].coins) || 0);
  return user?.role === 'admin' ? ADMIN_COINS : START_COINS;
}

/** Hediye harcaması için cüzdan — kayıt yoksa varsayılan bakiyeyle oluşturulur. */
export async function ensureGiftWallet(base44: any, user: any) {
  const found = await base44.asServiceRole.entities.GameWallet.filter({ user_id: user.id }, '-created_date', 1);
  const isAdmin = user?.role === 'admin';
  if (found[0]) {
    return found[0];
  }
  return base44.asServiceRole.entities.GameWallet.create({
    user_id: user.id,
    user_name: user.full_name || '',
    coins: isAdmin ? ADMIN_COINS : START_COINS,
    admin_granted: isAdmin,
  });
}