// DEDE oyunu: bahis kademeleri ve sembol kartları (arka uç kimlikleriyle birebir).
import { DEDE_ART } from './dedeAssets';

export const DEDE_LINES = 20;
export const DEDE_BET_LEVELS = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000];
// Küme ödemesi: ekranda en az bu kadar aynı sembol olunca öder.
export const DEDE_CLUSTER_MIN = 8;
export const DEDE_SCATTER_MIN = 4;

export const DEDE_SYMBOLS = {
  crown: { name: 'Taç', art: DEDE_ART.crown },
  amethyst: { name: 'Mor Damla', art: DEDE_ART.amethyst },
  gem: { name: 'Elmas', art: DEDE_ART.gem },
  topaz: { name: 'Altın Sekizgen', art: DEDE_ART.topaz },
  ring: { name: 'Yüzük', art: DEDE_ART.ring },
  hour: { name: 'Kum Saati', art: DEDE_ART.hour },
  chalice: { name: 'Kupa', art: DEDE_ART.chalice },
  bolt: { name: 'Yakut Yıldız', art: DEDE_ART.bolt },
  dede: { name: 'Dede', art: DEDE_ART.dede, scatter: true },
};

export const DEDE_IDS = Object.keys(DEDE_SYMBOLS);

// Kare kimliği çarpan jetonu mu? Örn. 'orb30' -> 30, sembolse null.
export const orbValueOf = (id) => {
  const match = /^orb(\d+)$/.exec(id || '');
  return match ? Number(match[1]) : null;
};

// Tur başlamadan ve makaralar akarken ekranda duran süs ızgarası.
export function randomGrid() {
  return Array.from({ length: 6 }, () =>
    Array.from({ length: 5 }, () => DEDE_IDS[Math.floor(Math.random() * DEDE_IDS.length)]),
  );
}

// Çevirme hakkı açılırken görünen açılış dizilimi: dört ayrı sütuna birer skatter,
// kalanı ödeme yapan nesnelerle dolar. Çarpan jetonu konmaz: çarpan ya da birleşme olmaz.
export function scatterIntroGrid() {
  const payers = DEDE_IDS.filter((id) => id !== 'dede');
  const grid = Array.from({ length: 6 }, () =>
    Array.from({ length: 5 }, () => payers[Math.floor(Math.random() * payers.length)]),
  );
  [0, 1, 2, 3, 4, 5]
    .sort(() => Math.random() - 0.5)
    .slice(0, DEDE_SCATTER_MIN)
    .forEach((reel) => {
      grid[reel][Math.floor(Math.random() * 5)] = 'dede';
    });
  return grid;
}

export const formatCoins = (value) =>
  new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));