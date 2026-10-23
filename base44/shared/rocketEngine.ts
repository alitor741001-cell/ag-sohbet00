// Crash Rocket oyun motoru: çarpan formülü, çakılma dağılımı ve bahis kademeleri.
// Backend (entry.ts) ile frontend (rocketConfig.js) aynı değerleri kullanır.

export const BETTING_MS = 20000;
// Çakılma anı ekranda kısa süre kalır, ardından yeni tur hemen başlar.
export const GAP_MS = 2000;
export const MAX_R = 500;
// Ev avantajı: çakılma noktaları bu oranla kısaltılır (ödeme oranı ~%91).
export const HOUSE_EDGE = 0.91;
export const ROCKET_BASE = 1.09;
export const DEFAULT_ROCKET_BET = 500;
export const ROCKET_BET_LEVELS = [500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
// Bahis ve otomatik çekilme üst sınırı.
export const MAX_ROCKET_BET = 1000000;
export const MAX_ROCKET_AUTO = 500;

// Geçen süreye göre çarpan: m = 1.09^(saniye). Uçuş uzun tutulur ki oyuncu
// geri çekmek için gerçek bir zaman penceresi bulsun: 2x ~8 sn, 10x ~27 sn.
export function multiplierAt(ms) {
  if (ms <= 0) return 1;
  return Math.pow(ROCKET_BASE, ms / 1000);
}

// Yüksek tur eşiği ve kademeleri: 100x-500x arası yüksek turlar bu kademelere
// dağıtılır. 500x en sık, 100/200/300/400 de düzenli çıkar.
export const BIG_THRESHOLD = 90;
const BIG_LADDER = [100, 150, 200, 250, 300, 400, 500];
const BIG_WEIGHTS = [12, 8, 12, 8, 12, 12, 36];
const BIG_WEIGHT_TOTAL = BIG_WEIGHTS.reduce((sum, weight) => sum + weight, 0);

function bigCrash() {
  let roll = Math.random() * BIG_WEIGHT_TOTAL;
  for (let i = 0; i < BIG_LADDER.length; i += 1) {
    roll -= BIG_WEIGHTS[i];
    if (roll < 0) return BIG_LADDER[i];
  }
  return BIG_LADDER[0];
}

// Çakılma noktası: 1/(1-r) dağılımı, %9 ev avantajı. Normal turlar 90x altında
// kalır. ~%7 olasılıkla yüksek tur (100x-500x) gelir: ortalama 14-15 turda bir
// büyük tur, 500x ise ~45-50 turda bir çıkar. 100/200/300/400 de düzenli görünür.
export function randomCrash() {
  const r = Math.random();
  if (r < 0.01) return 1;
  if (r < 0.08) return bigCrash();
  const c = HOUSE_EDGE / (1 - r);
  return Math.max(1.01, Math.min(BIG_THRESHOLD - 0.01, Math.round(c * 100) / 100));
}

export function nearestRocketBet(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_ROCKET_BET;
  return ROCKET_BET_LEVELS.reduce(
    (best, lvl) => (Math.abs(lvl - n) < Math.abs(best - n) ? lvl : best),
    ROCKET_BET_LEVELS[0]
  );
}

export function shiftRocketBet(value, dir) {
  const idx = ROCKET_BET_LEVELS.indexOf(nearestRocketBet(value));
  const next = Math.max(0, Math.min(ROCKET_BET_LEVELS.length - 1, idx + (dir > 0 ? 1 : -1)));
  return ROCKET_BET_LEVELS[next];
}