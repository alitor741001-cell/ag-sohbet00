// Meyve oyunu: bahis kademeleri ve sembol karoları (arka uç kimlikleriyle birebir).
export const FRUIT_LINES = 20;
export const FRUIT_BET_LEVELS = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000];
export const FRUIT_FREE_SPINS = 10;
// Küme ödemesi: ekranda en az bu kadar aynı sembol olunca öder.
export const FRUIT_CLUSTER_MIN = 8;

export const FRUIT_SYMBOLS = {
  lollipop: { emoji: '🍭', name: 'Lolipop' },
  plum: { emoji: '🫐', name: 'Erik' },
  grapes: { emoji: '🍇', name: 'Üzüm' },
  melon: { emoji: '🍉', name: 'Karpuz' },
  apple: { emoji: '🍎', name: 'Elma' },
  candy: { emoji: '🍬', name: 'Şeker' },
  cherry: { emoji: '🍒', name: 'Kiraz' },
  banana: { emoji: '🍌', name: 'Muz', scatter: true },
};

export const FRUIT_IDS = Object.keys(FRUIT_SYMBOLS);

// Tur başlamadan ekranda duran süs ızgarası.
export function randomGrid() {
  return Array.from({ length: 6 }, () =>
    Array.from({ length: 5 }, () => FRUIT_IDS[Math.floor(Math.random() * FRUIT_IDS.length)]),
  );
}

export const formatCoins = (value) =>
  new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));