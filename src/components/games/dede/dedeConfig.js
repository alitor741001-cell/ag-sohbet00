// DEDE oyunu: bahis kademeleri ve sembol karoları (arka uç kimlikleriyle birebir).
export const DEDE_LINES = 20;
export const DEDE_BET_LEVELS = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000];
export const DEDE_FREE_SPINS = 15;
// Küme ödemesi: ekranda en az bu kadar aynı sembol olunca öder.
export const DEDE_CLUSTER_MIN = 8;
export const DEDE_SCATTER_MIN = 4;

export const DEDE_SYMBOLS = {
  crown: { emoji: '👑', name: 'Taç' },
  gem: { emoji: '💎', name: 'Elmas' },
  ring: { emoji: '💍', name: 'Yüzük' },
  hour: { emoji: '⏳', name: 'Kum Saati' },
  chalice: { emoji: '🏆', name: 'Kupa' },
  bolt: { emoji: '⚡', name: 'Şimşek' },
  dede: { emoji: '👴', name: 'Dede', scatter: true },
};

export const DEDE_IDS = Object.keys(DEDE_SYMBOLS);

// Tur başlamadan ve makaralar akarken ekranda duran süs ızgarası.
export function randomGrid() {
  return Array.from({ length: 6 }, () =>
    Array.from({ length: 5 }, () => DEDE_IDS[Math.floor(Math.random() * DEDE_IDS.length)]),
  );
}

export const formatCoins = (value) =>
  new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));