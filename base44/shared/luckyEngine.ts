// Lucky Olympus oyun motoru: makara üretimi, satır kazançları, ücretsiz dönüş ve çarpan birikimi.

export const REELS = 5;
export const ROWS = 4;
export const LINES = 20;
export const SCATTER_TRIGGER = 4;
export const FREE_SPIN_COUNT = 15;
// Çarpan birleşince ödenen tutar: (birleşik çarpan x toplam bahis) / bu bölen.
export const MULTIPLIER_DIVISOR = 10;
export const MULTIPLIER_VALUES = [2, 3, 5, 10, 15, 25];
// Bahis kademeleri toplam bahistir; varsayılan görseldeki 2000 değeridir.
export const BET_LEVELS = [200, 500, 1000, 2000, 5000, 10000, 25000, 50000];
export const DEFAULT_BET = 2000;
// Ücretsiz dönüş paketi fiyatı: toplam bahsin bu katı.
export const BUY_COST_MULTIPLE = 25;
// Ücretsiz dönüşlerde çarpan sembolü daha sık gelir.
export const MULTIPLIER_WEIGHT = 30;

// Ödemeler satır bahsi (toplam bahis / 20) katıdır: 3, 4 ve 5 eşleşme.
export const SYMBOLS = [
  { id: 'crown', weight: 20, pays: [150, 750, 4000] },
  { id: 'cup', weight: 30, pays: [125, 500, 2000] },
  { id: 'ring', weight: 40, pays: [100, 350, 1300] },
  { id: 'star', weight: 50, pays: [75, 250, 900] },
  { id: 'gold', weight: 60, pays: [50, 175, 650] },
  { id: 'purple', weight: 70, pays: [40, 125, 450] },
  { id: 'blue', weight: 80, pays: [30, 90, 300] },
  { id: 'green', weight: 90, pays: [25, 65, 230] },
  { id: 'hourglass', weight: 100, pays: [20, 50, 180] },
  { id: 'scatter', weight: 17, scatter: true },
];

export const PAYLINES = [
  [0, 0, 0, 0, 0], [1, 1, 1, 1, 1], [2, 2, 2, 2, 2], [3, 3, 3, 3, 3],
  [0, 1, 2, 1, 0], [3, 2, 1, 2, 3], [1, 2, 3, 2, 1], [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2], [3, 3, 2, 1, 1], [1, 1, 2, 1, 1], [2, 2, 1, 2, 2],
  [0, 1, 0, 1, 0], [3, 2, 3, 2, 3], [1, 0, 1, 0, 1], [2, 3, 2, 3, 2],
  [0, 0, 0, 1, 2], [3, 3, 3, 2, 1], [1, 2, 1, 0, 1], [2, 1, 2, 3, 2],
];

const SYMBOL_MAP = SYMBOLS.reduce((acc, symbol) => {
  acc[symbol.id] = symbol;
  return acc;
}, {});

// Ağırlıklı havuz: normal oyunda çarpan sembolü yoktur, ücretsiz dönüşte eklenir.
function buildPool(multiplierWeight) {
  const pool = [];
  SYMBOLS.forEach((symbol) => {
    for (let index = 0; index < symbol.weight; index += 1) pool.push(symbol.id);
  });
  for (let index = 0; index < multiplierWeight; index += 1) pool.push('multi');
  return pool;
}

const BASE_POOL = buildPool(0);
const FREE_POOL = buildPool(MULTIPLIER_WEIGHT);

export function nearestBet(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_BET;
  return BET_LEVELS.reduce((best, level) => (Math.abs(level - number) < Math.abs(best - number) ? level : best), DEFAULT_BET);
}

function drawGrid(pool) {
  const grid = [];
  for (let reel = 0; reel < REELS; reel += 1) {
    const column = [];
    for (let row = 0; row < ROWS; row += 1) column.push(pool[Math.floor(Math.random() * pool.length)]);
    grid.push(column);
  }
  return grid;
}

// Çarpan sembollerinin değerleri: her sembol için 2x-25x arasından seçilir.
function drawMultipliers(grid) {
  return grid.map((column) =>
    column.map((symbol) => (symbol === 'multi' ? MULTIPLIER_VALUES[Math.floor(Math.random() * MULTIPLIER_VALUES.length)] : 0))
  );
}

export function evaluateGrid(grid, totalBet) {
  const betPerLine = totalBet / LINES;
  const wins = [];
  let lineWin = 0;

  PAYLINES.forEach((line, index) => {
    const first = grid[0][line[0]];
    const definition = SYMBOL_MAP[first];
    if (!definition || definition.scatter) return;
    let count = 1;
    while (count < REELS && grid[count][line[count]] === first) count += 1;
    if (count < 3) return;
    const amount = definition.pays[count - 3] * betPerLine;
    lineWin += amount;
    wins.push({ line: index + 1, symbol: first, count, amount });
  });

  let scatterCount = 0;
  grid.forEach((column) => column.forEach((symbol) => {
    if (symbol === 'scatter') scatterCount += 1;
  }));

  return { lineWin, wins, scatterCount, betPerLine };
}

// Çarpan birikimi: aynı değer ikinci kez gelirse birleşir, birleşik çarpan ödenir.
export function collectMultipliers(accumulator, values, totalBet) {
  const list = [...accumulator];
  const collected = [];
  let paid = 0;

  values.filter((value) => value > 0).forEach((value) => {
    const index = list.indexOf(value);
    if (index === -1) {
      list.push(value);
      collected.push({ value, merged: 0, paid: 0 });
      return;
    }
    list.splice(index, 1);
    const merged = value * 2;
    const amount = (merged * totalBet) / MULTIPLIER_DIVISOR;
    paid += amount;
    collected.push({ value, merged, paid: amount });
  });

  return { list, collected, paid };
}

/** Tek dönüş: makaralar, satır kazançları, çarpan birikimi ve ücretsiz dönüş tetiklemesi. */
export function drawSpin({ totalBet, freeSpin, accumulator }) {
  const grid = drawGrid(freeSpin ? FREE_POOL : BASE_POOL);
  const multiValues = drawMultipliers(grid);
  const { lineWin, wins, scatterCount, betPerLine } = evaluateGrid(grid, totalBet);

  let multipliers = [...(accumulator || [])];
  let collected = [];
  let multiplierPaid = 0;
  if (freeSpin) {
    const result = collectMultipliers(multipliers, multiValues.flat(), totalBet);
    multipliers = result.list;
    collected = result.collected;
    multiplierPaid = result.paid;
  }

  return {
    grid,
    multiValues,
    wins,
    lineWin,
    betPerLine,
    scatterCount,
    freeSpinsAwarded: scatterCount >= SCATTER_TRIGGER ? FREE_SPIN_COUNT : 0,
    multipliers,
    collected,
    multiplierPaid,
    totalWin: lineWin + multiplierPaid,
  };
}