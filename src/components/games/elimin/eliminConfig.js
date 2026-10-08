// ELİMİNSLOT: 6 sütun x 5 satır kare kart meyve slotu.
// Kartlar meyve oyununun görselleridir; ödeme tablosu sunucudaki motorla birebir.
import { FRUIT_ART, FRUIT_ART_SIZE } from '../fruit/fruitAssets';
import { ELIMIN_EXTRA_ART } from './eliminExtraArt';

export const REELS = 6;
export const ROWS = 5;
// Toplam bahis = bahis x 20 satır.
export const LINES = 20;
export const BET_LEVELS = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000];
// Altın muz bonusunun verdiği bedava tur ve göstergenin üst sınırı.
export const FREE_MAX = 10;
export const SCATTER_ID = 'banana';
// Tavuk: üç tanesi bedava tur verir.
export const CHICKEN_MIN = 3;
export const CHICKEN_FREE_SPINS = 3;
// Zar: dört tanesi jackpotu patlatır, biriken jackpotun yarısını öder.
export const DICE_MIN = 4;
// Sandık: jackpot barında birikir; her sandık bahsin bu katı kadar değer ekler.
export const CHEST_MAX = 10;
export const JACKPOT_PER_CHEST = 100;

// pays: 8-9, 10-11 ve 12+ aynı meyve için bahis katı.
export const ELIMIN_SYMBOLS = {
  lollipop: { name: 'Lolipop', art: FRUIT_ART.lollipop, pays: [144, 450, 1440] },
  plum: { name: 'Erik', art: FRUIT_ART.plum, pays: [90, 270, 900] },
  grapes: { name: 'Üzüm', art: FRUIT_ART.grapes, pays: [72, 216, 630] },
  melon: { name: 'Karpuz', art: FRUIT_ART.melon, pays: [54, 162, 450] },
  apple: { name: 'Elma', art: FRUIT_ART.apple, pays: [36, 108, 324] },
  candy: { name: 'Şeker', art: FRUIT_ART.candy, pays: [27, 72, 216] },
  cherry: { name: 'Kiraz', art: FRUIT_ART.cherry, pays: [18, 54, 162] },
  banana: { name: 'Altın Muz', art: FRUIT_ART.banana, scatter: true, tag: 'BEDAVA TUR', pays: [54, 108, 216] },
  chicken: {
    name: 'Tavuk',
    art: ELIMIN_EXTRA_ART.chicken,
    free: true,
    tag: 'BEDAVA TUR',
    note: `${CHICKEN_MIN} TAVUK = ${CHICKEN_FREE_SPINS} BEDAVA TUR`,
  },
  dice: {
    name: 'Zar',
    art: ELIMIN_EXTRA_ART.dice,
    jackpot: true,
    tag: 'JACKPOT',
    note: `${DICE_MIN} ZAR = JACKPOTUN YARISI`,
  },
  chest: {
    name: 'Sandık',
    art: ELIMIN_EXTRA_ART.chest,
    chest: true,
    tag: 'JACKPOT BARI',
    note: 'JACKPOT BARINDA BİRİKİR',
  },
};

export const SYMBOL_IDS = Object.keys(ELIMIN_SYMBOLS);
export const ART_SIZE = FRUIT_ART_SIZE;

// Tur başlamadan ve makaralar akarken ekranda duran süs ızgarası.
export function randomGrid() {
  return Array.from({ length: REELS }, () =>
    Array.from({ length: ROWS }, () => SYMBOL_IDS[Math.floor(Math.random() * SYMBOL_IDS.length)]),
  );
}

export const formatCoins = (value) =>
  new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));