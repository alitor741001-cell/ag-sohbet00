// Crash Rocket oyun motoru: çarpan formülü, çakılma dağılımı ve bahis kademeleri.
// Backend (entry.ts) ile frontend (rocketConfig.js) aynı değerleri kullanır.

export const BETTING_MS = 20000;
// Çakılma anı ekranda kısa süre kalır, ardından yeni tur hemen başlar.
export const GAP_MS = 2000;
export const MAX_R = 500;
export const HOUSE_EDGE = 0.99;
export const ROCKET_BASE = 1.09;
export const DEFAULT_ROCKET_BET = 500;
export const ROCKET_BET_LEVELS = [500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

// Geçen süreye göre çarpan: m = 1.09^(saniye). Uçuş uzun tutulur ki oyuncu
// geri çekmek için gerçek bir zaman penceresi bulsun: 2x ~8 sn, 10x ~27 sn.
export function multiplierAt(ms) {
  if (ms <= 0) return 1;
  return Math.pow(ROCKET_BASE, ms / 1000);
}

// Çakılma noktası: 1/(1-r) dağılımı, %1 ev avantajı, 500x üst sınır.
export function randomCrash() {
  const r = Math.random();
  if (r < 0.01) return 1;
  const c = HOUSE_EDGE / (1 - r);
  return Math.min(MAX_R, Math.max(1.01, Math.round(c * 100) / 100));
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