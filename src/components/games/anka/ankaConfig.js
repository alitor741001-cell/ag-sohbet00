export const ANKA_ART = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/37dbc49b3_generated_image.png';
export const ANKA_SYMBOLS = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/1e3a9544f_generated_image.png';
export const ANKA_BETS = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000];
export const ANKA_LINES = 20;
export const SYMBOL_NAMES = { cup: 'Altın Kadeh', lantern: 'Zümrüt Fener', bag: 'Altın Kesesi', egg: 'Anka Yumurtası', coin: 'Güneş Altını', phoenix: 'Anka Kuşu' };
export const SYMBOL_IDS = Object.keys(SYMBOL_NAMES);
export const INITIAL_GRID = [['cup', 'cup', 'cup'], ['bag', 'coin', 'lantern', 'lantern', 'lantern'], ['cup', 'coin', 'egg']];
export const formatCoins = value => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));