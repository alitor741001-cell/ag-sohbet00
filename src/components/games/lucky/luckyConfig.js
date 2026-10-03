// Lucky Olympus arayüz sabitleri: bahis kademeleri, sembol karoları ve süreler.
export const BET_LEVELS = [200, 500, 1000, 2000, 5000, 10000, 25000, 50000];
export const DEFAULT_BET = 2000;
export const SPIN_MS = 5000;
export const FREE_SPIN_COUNT = 15;
export const SCATTER_TRIGGER = 4;
export const MULTIPLIER_VALUES = [2, 3, 5, 10, 15, 25];

// Sembol karoları oyun ekranındaki 5x4 ızgaradan birebir kesilmiştir.
export const SYMBOL_TILES = {
  crown: 'https://base44.app/api/apps/6a77d66e4da6de214628ee62/files/mp/public/6a77d66e4da6de214628ee62/5d6359edd_lucky-symbol-0.png',
  hourglass: 'https://base44.app/api/apps/6a77d66e4da6de214628ee62/files/mp/public/6a77d66e4da6de214628ee62/9da50efb2_lucky-symbol-2.png',
  ring: 'https://base44.app/api/apps/6a77d66e4da6de214628ee62/files/mp/public/6a77d66e4da6de214628ee62/b30a3d09f_lucky-symbol-3.png',
  scatter: 'https://base44.app/api/apps/6a77d66e4da6de214628ee62/files/mp/public/6a77d66e4da6de214628ee62/19457e861_lucky-symbol-4.png',
  cup: 'https://base44.app/api/apps/6a77d66e4da6de214628ee62/files/mp/public/6a77d66e4da6de214628ee62/fdef8f81e_lucky-symbol-5.png',
  star: 'https://base44.app/api/apps/6a77d66e4da6de214628ee62/files/mp/public/6a77d66e4da6de214628ee62/bdfedc713_lucky-symbol-6.png',
  purple: 'https://base44.app/api/apps/6a77d66e4da6de214628ee62/files/mp/public/6a77d66e4da6de214628ee62/2d6a65c52_lucky-symbol-7.png',
  gold: 'https://base44.app/api/apps/6a77d66e4da6de214628ee62/files/mp/public/6a77d66e4da6de214628ee62/efb5c0561_lucky-symbol-8.png',
  green: 'https://base44.app/api/apps/6a77d66e4da6de214628ee62/files/mp/public/6a77d66e4da6de214628ee62/eab56d97c_lucky-symbol-9.png',
  blue: 'https://base44.app/api/apps/6a77d66e4da6de214628ee62/files/mp/public/6a77d66e4da6de214628ee62/96ae3dc6c_lucky-symbol-10.png',
};

export const SYMBOL_IDS = Object.keys(SYMBOL_TILES);

export const SYMBOL_LABELS = {
  crown: 'Taç',
  cup: 'Kupa',
  ring: 'Yüzük',
  star: 'Kırmızı Yıldız',
  gold: 'Altın Elmas',
  purple: 'Mor Elmas',
  blue: 'Mavi Elmas',
  green: 'Yeşil Üçgen',
  hourglass: 'Kum Saati',
  scatter: 'Zeus (SCATTER)',
  multi: 'Çarpan',
};

// Kural ekranındaki ödeme tablosu: satır bahsi (toplam bahis / 20) katı.
export const PAYS = {
  crown: [150, 750, 4000],
  cup: [125, 500, 2000],
  ring: [100, 350, 1300],
  star: [75, 250, 900],
  gold: [50, 175, 650],
  purple: [40, 125, 450],
  blue: [30, 90, 300],
  green: [25, 65, 230],
  hourglass: [20, 50, 180],
};

export const formatCoins = (value) => Math.round(value || 0).toLocaleString('tr-TR');

export const shortCoins = (value) => {
  const number = Math.round(value || 0);
  if (number >= 1000000) return `${(number / 1000000).toFixed(number % 1000000 === 0 ? 0 : 1)}M`;
  if (number >= 1000) return `${Math.round(number / 1000)}K`;
  return `${number}`;
};