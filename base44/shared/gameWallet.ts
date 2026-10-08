// Oyun cüzdanı: slot ve meyve oyunları aynı bakiyeyi paylaşır.
// Bahis kademeleri oyuna özel olduğu için kademe listesi parametre olarak geçilir.

export const START_COINS = 100000;
// Yönetici bakiyesi: 500 bin coin.
export const ADMIN_COINS = 500000;
export const DEFAULT_BET = 100;
// "15 ücretsiz spin" düğmesinin verdiği bedava tur sayısı.
export const FREE_GRANT = 15;
// Eski sürümden kalan devasa bakiyeler bu sınırın üzerindeyse normale çekilir.
const LEGACY_MAX_COINS = 1000000000;

// Bahis yalnızca oyunun tanımlı kademelerinden biri olabilir: en yakın kademeye oturtulur.
export function nearestBet(value, levels, fallback = DEFAULT_BET) {
  const numeric = Math.round(Number(value));
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return levels.reduce((best, level) => (
    Math.abs(level - numeric) < Math.abs(best - numeric) ? level : best
  ), levels[0]);
}

// Geçersiz istekte mevcut bahis korunur.
export function clampBet(value, levels, fallback) {
  const numeric = Math.round(Number(value));
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return nearestBet(numeric, levels);
}

// Bakiye gerçek: harcadıkça azalır, kazandıkça çoğalır; otomatik tamamlama yok.
export async function loadWallet(base44, user) {
  const found = await base44.asServiceRole.entities.GameWallet.filter({ user_id: user.id }, '-created_date', 1);
  const isAdmin = user.role === 'admin';
  if (found[0]) {
    if ((found[0].coins ?? 0) > LEGACY_MAX_COINS) {
      return base44.asServiceRole.entities.GameWallet.update(found[0].id, {
        coins: isAdmin ? ADMIN_COINS : START_COINS,
      });
    }
    return found[0];
  }
  return base44.asServiceRole.entities.GameWallet.create({
    user_id: user.id,
    user_name: user.full_name || '',
    coins: isAdmin ? ADMIN_COINS : START_COINS,
    admin_granted: isAdmin,
    bet: DEFAULT_BET,
    spins: 0,
    grand: 0,
    total_won: 0,
  });
}