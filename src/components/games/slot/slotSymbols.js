import { SYMBOL_IMAGES } from '../slotAssets';

export const LINES = 50;
export const MIN_BET = 10;
export const MAX_BET = 1000;
export const BET_STEP = 10;

export const SLOT_SYMBOLS = {
  ten: { label: '10' },
  jack: { label: 'J' },
  queen: { label: 'Q' },
  king: { label: 'K' },
  ace: { label: 'A' },
  eagle: { image: SYMBOL_IMAGES.eagle },
  tiger: { image: SYMBOL_IMAGES.tiger },
  lion: { image: SYMBOL_IMAGES.lion, wild: true },
  jackpot: { image: SYMBOL_IMAGES.jackpot },
  free: { image: SYMBOL_IMAGES.free },
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
  'eagle',
  'tiger',
  'lion',
  'jackpot',
  'free',
];

export const randomSymbol = () => TUMBLE_POOL[Math.floor(Math.random() * TUMBLE_POOL.length)];

export const randomColumn = () => [randomSymbol(), randomSymbol(), randomSymbol()];

export const INITIAL_GRID = [
  ['queen', 'lion', 'ace'],
  ['king', 'eagle', 'jack'],
  ['ten', 'tiger', 'queen'],
  ['ace', 'jackpot', 'king'],
  ['jack', 'free', 'ten'],
];

export function winCellsOf(wins) {
  if (!Array.isArray(wins)) return [];
  const keys = new Set();
  wins.forEach((entry) => {
    (entry.cells || []).forEach((cell) => keys.add(`${cell.reel}-${cell.row}`));
  });
  return Array.from(keys);
}