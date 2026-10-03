import { SYMBOL_IMAGES } from '../slotAssets';

export const LINES = 50;
export const MIN_BET = 10;
export const MAX_BET = 1000;
export const BET_STEP = 10;

const CARD_TONES = {
  ten: 'slot-card-purple',
  jack: 'slot-card-blue',
  queen: 'slot-card-green',
  king: 'slot-card-red',
  ace: 'slot-card-gold',
};

export const SLOT_SYMBOLS = {
  ten: { label: '10', cardClass: CARD_TONES.ten },
  jack: { label: 'J', cardClass: CARD_TONES.jack },
  queen: { label: 'Q', cardClass: CARD_TONES.queen },
  king: { label: 'K', cardClass: CARD_TONES.king },
  ace: { label: 'A', cardClass: CARD_TONES.ace },
  gem: { image: SYMBOL_IMAGES.gem },
  eagle: { image: SYMBOL_IMAGES.eagle },
  tiger: { image: SYMBOL_IMAGES.tiger },
  lion: { image: SYMBOL_IMAGES.lion, wild: true },
  free: { image: SYMBOL_IMAGES.free },
  jackpot: { image: SYMBOL_IMAGES.jackpot },
};

const TUMBLE_POOL = [
  'ten',
  'ten',
  'jack',
  'jack',
  'queen',
  'queen',
  'king',
  'king',
  'ace',
  'ace',
  'gem',
  'gem',
  'eagle',
  'tiger',
  'lion',
  'jackpot',
  'free',
];

export const randomSymbol = () => TUMBLE_POOL[Math.floor(Math.random() * TUMBLE_POOL.length)];

export const randomColumn = () => [randomSymbol(), randomSymbol(), randomSymbol()];

export const INITIAL_GRID = [
  ['queen', 'lion', 'gem'],
  ['king', 'eagle', 'jack'],
  ['ten', 'tiger', 'queen'],
  ['ace', 'jackpot', 'king'],
  ['gem', 'free', 'ten'],
];

export function winCellsOf(wins) {
  if (!Array.isArray(wins)) return [];
  const keys = new Set();
  wins.forEach((entry) => {
    (entry.cells || []).forEach((cell) => keys.add(`${cell.reel}-${cell.row}`));
  });
  return Array.from(keys);
}