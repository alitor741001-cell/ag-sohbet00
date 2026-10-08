// DEDE oyunu: bahis kademeleri ve sembol kartları (arka uç kimlikleriyle birebir).
import { DEDE_ART } from './dedeAssets';

export const DEDE_LINES = 20;
export const DEDE_BET_LEVELS = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000];
export const DEDE_FREE_SPINS = 15;
// Küme ödemesi: ekranda en az bu kadar aynı sembol olunca öder.
export const DEDE_CLUSTER_MIN = 8;
export const DEDE_SCATTER_MIN = 4;

export const DEDE_SYMBOLS = {
  crown: { name: 'Taç', art: DEDE_ART.crown },
  gem: { name: 'Elmas', art: DEDE_ART.gem },
  ring: { name: 'Yüzük', art: DEDE_ART.ring },
  hour: { name: 'Kum Saati', art: DEDE_ART.hour },
  chalice: { name: 'Kupa', art: DEDE_ART.chalice },
  bolt: { name: 'Şimşek', art: DEDE_ART.bolt },
  dede: { name: 'Dede', art: DEDE_ART.dede, scatter: true },
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