// ZAR masası: jeton kademeleri, üç bahis alanı ve zar görünümü.

export const CHIP_LEVELS = [10, 100, 1000, 10000];
export const CHIP_LABELS = { 10: '10', 100: '100', 1000: '1K', 10000: '10K' };
// Jeton kademelerinin rengi referans görseldeki gibi ayrışır.
export const CHIP_TONES = { 10: 'green', 100: 'blue', 1000: 'pink', 10000: 'gold' };

// Üç zar üç kulübü temsil eder: 1. zar siyah-beyaz, 2. lacivert-sarı, 3. sarı-kırmızı arma.
export const DICE_TEAMS = ['bjk', 'fb', 'gs'];

// Bahis alanları: kaplan üstte tek blok, küçük ve büyük altta iki blok.
export const ZONES = [
  { id: 'kaplan', label: 'KAPLAN', range: '3 · 18', mult: 35, tone: 'kaplan' },
  { id: 'kucuk', label: 'KÜÇÜK', range: '4-10', mult: 2, tone: 'kucuk' },
  { id: 'buyuk', label: 'BÜYÜK', range: '11-17', mult: 2, tone: 'buyuk' },
];
export const ZONE_IDS = ZONES.map((zone) => zone.id);
export const ZONE_LABEL = { kaplan: 'KAPLAN', kucuk: 'KÜÇÜK', buyuk: 'BÜYÜK' };
export const ZONE_MULT = { kaplan: 35, kucuk: 2, buyuk: 2 };

// Tur süreleri sunucuda yönetilir (base44/shared/zarRound.ts): 20 sn bahis, 9 sn zar.
// Kase bu sürenin başında kapalı çalkalanır; sonra dikey olarak kalkıp zarları açar.
export const SHAKE_HIDE_MS = 3000;

/** Zar toplamının düştüğü alan: 3 ve 18 kaplan, 4-10 küçük, 11-17 büyük. */
export const sumTone = (sum) => {
  if (sum === 3 || sum === 18) return 'kaplan';
  return sum <= 10 ? 'kucuk' : 'buyuk';
};

export const outcomeName = (outcome) => (outcome === 'kaplan' ? 'KAPLAN' : outcome === 'kucuk' ? 'KÜÇÜK' : outcome === 'buyuk' ? 'BÜYÜK' : '');

export const formatCoins = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

/** Jeton üstündeki kısa tutar: 100 → "100", 1.000 → "1K", 10.000 → "10K". */
export const formatChipAmount = (value) => {
  const amount = Math.max(0, Math.round(value || 0));
  const short = (unit) => {
    const size = amount / unit;
    return `${Number.isInteger(size) ? size : size.toFixed(1)}${unit === 1000000 ? 'M' : 'K'}`;
  };
  if (amount >= 1000000) return short(1000000);
  if (amount >= 1000) return short(1000);
  return `${amount}`;
};

/** Jeton rengi tutara göre değişir: 10 yeşil, 100 mavi, bin pembe, on bin ve üstü altın. */
export const chipTone = (value) => {
  const amount = value || 0;
  if (amount >= 10000) return 'gold';
  if (amount >= 1000) return 'pink';
  if (amount >= 100) return 'blue';
  return 'green';
};

// Zar yüzü: 3x3 ızgarada açık kalan noktalar (1-6).
const PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};
export const pipLayout = (value) => {
  const open = PIPS[value] || [];
  return Array.from({ length: 9 }, (_, index) => open.includes(index));
};