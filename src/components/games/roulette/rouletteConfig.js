// ROULETTE masası: jeton kademeleri, sekiz bahis bloğu ve çark düzeni.

export const CHIP_LEVELS = [500, 1000, 10000, 100000];
export const CHIP_LABELS = { 500: '500', 1000: '1K', 10000: '10K', 100000: '100K' };

export const BLOCKS = [
  { id: 'zero', label: '0', sub: 'x36' },
  { id: 'dozen1', label: '1-12', sub: 'x3' },
  { id: 'dozen2', label: '13-24', sub: 'x3' },
  { id: 'dozen3', label: '25-36', sub: 'x3' },
  { id: 'red', label: 'KIRMIZI', sub: 'x2' },
  { id: 'black', label: 'SİYAH', sub: 'x2' },
  { id: 'even', label: 'ÇİFT', sub: 'x2' },
  { id: 'odd', label: 'TEK', sub: 'x2' },
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

export const pocketName = (number) => (number === 0 ? 'YEŞİL' : RED_NUMBERS.includes(number) ? 'KIRMIZI' : 'SİYAH');