// ROULETTE masası: jeton kademeleri, sekiz bahis bloğu ve çark düzeni.

export const CHIP_LEVELS = [500, 1000, 10000, 100000];
export const CHIP_LABELS = { 500: '500', 1000: '1K', 10000: '10K', 100000: '100K' };

export const BLOCKS = [
  { id: 'zero', label: '0', sub: 'x36' },
  { id: 'dozen1', label: '1-12', sub: 'x3' },
  { id: 'dozen2', label: '13-24', sub: 'x3' },
  { id: 'dozen3', label: '25-36', sub: 'x3' },
  { id: 'red', label: 'Kırmızı', sub: 'x2' },
  { id: 'black', label: 'Siyah', sub: 'x2' },
  { id: 'even', label: 'Çift', sub: 'x2' },
  { id: 'odd', label: 'Tek', sub: 'x2' },
];

export const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// Bir cebin açı genişliği: çark 37 eşit dilime bölünür.
export const POCKET_STEP = 360 / WHEEL_ORDER.length;
// Tur süreleri sunucuda yönetilir (base44/shared/rouletteRound.ts): 20 sn bahis, 10 sn çark.

export const formatCoins = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

export const pocketTone = (number) => (number === 0 ? 'green' : RED_NUMBERS.includes(number) ? 'red' : 'black');

// Kısa tutar: 1000 → 1K, 1500000 → 1.5M (masa blokları ve jetonlar için).
export const shortCoins = (value) => {
  const n = Math.max(0, Math.round(value || 0));
  if (n >= 1e6) return `${+(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${+(n / 1e3).toFixed(1)}K`;
  return String(n);
};

// Bir bahis bloğu çıkan numarayı kazanıyor mu?
export const blockWins = (id, number) => {
  if (number === null || number === undefined) return false;
  if (id === 'zero') return number === 0;
  if (number === 0) return false;
  if (id === 'dozen1') return number <= 12;
  if (id === 'dozen2') return number > 12 && number <= 24;
  if (id === 'dozen3') return number > 24;
  if (id === 'red') return RED_NUMBERS.includes(number);
  if (id === 'black') return !RED_NUMBERS.includes(number);
  if (id === 'even') return number % 2 === 0;
  return number % 2 === 1;
};

export const pocketName = (number) => (number === 0 ? 'YEŞİL' : RED_NUMBERS.includes(number) ? 'KIRMIZI' : 'SİYAH');