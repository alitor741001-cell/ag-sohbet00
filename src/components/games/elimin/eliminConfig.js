// ELİMİNSLOT: 6 sütun x 5 satır kare kart meyve slotu.
// Kartlar meyve oyununun görselleridir; ödeme tablosu sunucudaki motorla birebir.
import { ELIMIN_ART_SIZE, ELIMIN_SYMBOL_ART } from './eliminSymbolArt';

export const REELS = 6;
export const ROWS = 5;
// Toplam bahis = bahis x 20 satır.
export const LINES = 20;
export const BET_LEVELS = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000];
export const SCATTER_ID = 'banana';
// Zar: dört tanesi jackpot havuzunu patlatır, havuzun yarısını öder.
export const DICE_MIN = 4;
// Tavuk: üç tanesi üç bedava tur verir.
export const CHICKEN_MIN = 3;
export const FREE_SPINS = 3;
// Sandık: jackpot barında birikir; bardaki her sandık bahsin bu katı kadar değer taşır.
export const CHEST_MAX = 10;
export const JACKPOT_PER_CHEST = 10;
// Kazanç seyrek gelsin: küme 9'da başlar (sunucudaki eşikle aynı).
export const CLUSTER_MIN = 9;

// pays: 9-11, 12-14 ve 15+ aynı meyve için bahis katı.
export const ELIMIN_SYMBOLS = {
  plum: { name: 'Yaban Mersini', art: ELIMIN_SYMBOL_ART.plum, pays: [90, 270, 900] },
  grapes: { name: 'Üzüm', art: ELIMIN_SYMBOL_ART.grapes, pays: [72, 216, 630] },
  melon: { name: 'Ejder Meyvesi', art: ELIMIN_SYMBOL_ART.melon, pays: [54, 162, 450] },
  apple: { name: 'Elma', art: ELIMIN_SYMBOL_ART.apple, pays: [36, 108, 324] },
  candy: { name: 'Portakal', art: ELIMIN_SYMBOL_ART.candy, pays: [27, 72, 216] },
  cherry: { name: 'Çilek', art: ELIMIN_SYMBOL_ART.cherry, pays: [18, 54, 162] },
  banana: { name: 'Altın Muz', art: ELIMIN_SYMBOL_ART.banana, scatter: true, pays: [54, 108, 216] },
  chicken: {
    name: 'Tavuk',
    art: ELIMIN_SYMBOL_ART.chicken,
    free: true,
    tag: 'BEDAVA TUR',
    note: `${CHICKEN_MIN} TAVUK = ${FREE_SPINS} BEDAVA TUR`,
  },
  dice: {
    name: 'Zar',
    art: ELIMIN_SYMBOL_ART.dice,
    jackpot: true,
    tag: 'JACKPOT',
    note: `${DICE_MIN} ZAR = JACKPOTUN YARISI`,
  },
  chest: {
    name: 'Sandık',
    art: ELIMIN_SYMBOL_ART.chest,
    chest: true,
    tag: 'SANDIK BARI',
    note: `${CHEST_MAX} SANDIK DOLUNCA TOPLA`,
  },
};

export const SYMBOL_IDS = Object.keys(ELIMIN_SYMBOLS);
export const ART_SIZE = ELIMIN_ART_SIZE;

// Tur başlamadan ve makaralar akarken ekranda duran süs ızgarası.
export function randomGrid() {
  return Array.from({ length: REELS }, () =>
    Array.from({ length: ROWS }, () => SYMBOL_IDS[Math.floor(Math.random() * SYMBOL_IDS.length)]),
  );
}

export const formatCoins = (value) =>
  new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));