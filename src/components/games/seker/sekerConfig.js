// Şeker oyunu: bahis kademeleri ve şeker renkleri (arka uç kimlikleriyle birebir).
// Renkler referans görseldeki parlak şekerlerden alındı.

export const SEKER_LINES = 20;
export const SEKER_BET_LEVELS = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000];
// Küme ödemesi: ekranda en az bu kadar aynı şeker olunca öder.
export const SEKER_CLUSTER_MIN = 10;

export const SEKER_SYMBOLS = {
  flower: { name: 'Mor Çiçek', shape: 'flower', color: '#c028ff', light: '#eaa8ff', dark: '#7a10b4' },
  sphere: { name: 'Mavi Top', shape: 'sphere', color: '#2381ff', light: '#9ac9ff', dark: '#0c4aa4' },
  bean: { name: 'Kırmızı Fasulye', shape: 'bean', color: '#ff1e1e', light: '#ff9a9a', dark: '#a40000' },
  oval: { name: 'Turuncu Şeker', shape: 'oval', color: '#ff8a00', light: '#ffcb7a', dark: '#b35400' },
  square: { name: 'Yeşil Küp', shape: 'square', color: '#56db14', light: '#bdff85', dark: '#2d8605' },
  drop: { name: 'Sarı Damla', shape: 'drop', color: '#ffdc00', light: '#fff6a8', dark: '#c39c00' },
  golden: { name: 'Altın Şeker', shape: 'wrapped', color: '#ffc63a', light: '#fff3c6', dark: '#b8791a', scatter: true },
};

export const SEKER_IDS = Object.keys(SEKER_SYMBOLS);

// Tur başlamadan ve ızgara dolarken ekranda duran süs ızgarası.
export function randomGrid() {
  return Array.from({ length: 6 }, () =>
    Array.from({ length: 6 }, () => SEKER_IDS[Math.floor(Math.random() * SEKER_IDS.length)]),
  );
}

export const formatCoins = (value) =>
  new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));