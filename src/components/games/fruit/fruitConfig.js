// Meyve oyunu: bahis kademeleri ve sembol kartları (arka uç kimlikleriyle birebir).
import { FRUIT_ART } from './fruitAssets';

export const FRUIT_LINES = 20;
export const FRUIT_BET_LEVELS = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000];
export const FRUIT_FREE_SPINS = 10;
// Küme ödemesi: ekranda en az bu kadar aynı sembol olunca öder.
export const FRUIT_CLUSTER_MIN = 8;

export const FRUIT_SYMBOLS = {
  lollipop: { name: 'Lolipop', art: FRUIT_ART.lollipop },
  plum: { name: 'Yaban Mersini', art: FRUIT_ART.plum },
  grapes: { name: 'Üzüm', art: FRUIT_ART.grapes },
  melon: { name: 'Karpuz', art: FRUIT_ART.melon },
  apple: { name: 'Elma', art: FRUIT_ART.apple },
  candy: { name: 'Şeker', art: FRUIT_ART.candy },
  cherry: { name: 'Kiraz', art: FRUIT_ART.cherry },
  banana: { name: 'Altın Muz', art: FRUIT_ART.banana, scatter: true },
};

export const FRUIT_IDS = Object.keys(FRUIT_SYMBOLS);

// Tur başlamadan ve makaralar akarken ekranda duran süs ızgarası.
export function randomGrid() {
  return Array.from({ length: 6 }, () =>
    Array.from({ length: 5 }, () => FRUIT_IDS[Math.floor(Math.random() * FRUIT_IDS.length)]),
  );
}

export const formatCoins = (value) =>
  new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));