// Şeker oyunu: bahis kademeleri ve şeker sembolleri (arka uç kimlikleriyle birebir).
import { SEKER_ART } from './sekerAssets';

export const SEKER_LINES = 20;
export const SEKER_BET_LEVELS = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000];
// Küme ödemesi: ekranda en az bu kadar aynı şeker olunca öder.
export const SEKER_CLUSTER_MIN = 10;

export const SEKER_SYMBOLS = {
  flower: { name: 'Mor Çiçek', art: SEKER_ART.flower },
  sphere: { name: 'Mavi Top', art: SEKER_ART.sphere },
  bean: { name: 'Kırmızı Fasulye', art: SEKER_ART.bean },
  oval: { name: 'Turuncu Şeker', art: SEKER_ART.oval },
  square: { name: 'Yeşil Küp', art: SEKER_ART.square },
  drop: { name: 'Sarı Damla', art: SEKER_ART.drop },
  golden: { name: 'Altın Şeker', art: SEKER_ART.golden, scatter: true },
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