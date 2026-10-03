// Crash Rocket frontend config — backend ile aynı değerler.
export const ROCKET_BET_LEVELS = [500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
// Otomatik çekilme kademeleri: 0 = kapalı.
export const ROCKET_AUTO_LEVELS = [0, 1.1, 1.2, 1.5, 2, 3, 5, 10];
export const ROCKET_BASE = 1.12;
export const DEFAULT_ROCKET_BET = 500;
export const BETTING_MS = 6000;
export const MAX_R = 500;

export function multiplierAt(ms) {
  if (ms <= 0) return 1;
  return Math.pow(ROCKET_BASE, ms / 1000);
}

// Uçuş ilerlemesi: çarpan büyüdükçe roket sağ-yukarı süzülür ve bir noktada oturur.
export function flightProgress(mult) {
  const extra = Math.max(0, (mult || 1) - 1);
  return 1 - Math.exp(-extra / 3);
}

export function colorForMult(m) {
  if (m < 2) return 'blue';
  if (m < 8) return 'green';
  if (m < 25) return 'yellow';
  return 'red';
}

export const MULT_COLOR_CLASS = {
  blue: 'text-sky-400',
  green: 'text-emerald-400',
  yellow: 'text-amber-300',
  red: 'text-red-500',
};

export const MULT_PILL_CLASS = {
  blue: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
  green: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
  yellow: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
  red: 'bg-red-500/25 text-red-300 border-red-400/50',
};

export function format(n) {
  return new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(n || 0)));
}

export function formatMult(m) {
  return (Math.round((m || 0) * 100) / 100).toFixed(2) + 'x';
}

export function formatAuto(a) {
  return a > 0 ? formatMult(a) : 'KAPALI';
}