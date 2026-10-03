export const LINES = 50;

// Bahis kademeleri: total bet = bahis x 50 satır.
export const BET_LEVELS = [10, 20, 50, 100, 500, 1000, 5000, 8000, 10000];

// Toplam bahsin bu katı ve üzeri kazançlar "büyük ödül" sayılır.
export const BIG_WIN_MULTIPLE = 10;

export const SYMBOLS = [
  { id: 'ten', weight: 14, pays: [10, 30, 100] },
  { id: 'jack', weight: 13, pays: [12, 40, 150] },
  { id: 'queen', weight: 12, pays: [15, 50, 200] },
  { id: 'king', weight: 11, pays: [20, 70, 300] },
  { id: 'ace', weight: 9, pays: [25, 100, 500] },
  { id: 'gem', weight: 5, pays: [30, 150, 800] },
  { id: 'eagle', weight: 6, pays: [40, 200, 1000] },
  { id: 'tiger', weight: 5, pays: [60, 300, 1500] },
  { id: 'lion', weight: 3, wild: true, pays: [100, 600, 3000] },
  { id: 'free', weight: 2, scatter: true, pays: [20, 100, 500] },
  { id: 'jackpot', weight: 1, pays: [150, 1000, 5000] },
];

const SYMBOL_MAP = SYMBOLS.reduce((acc, symbol) => {
  acc[symbol.id] = symbol;
  return acc;
}, {});

const SEED_LINES = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [1, 0, 1, 0, 1],
  [1, 2, 1, 2, 1],
  [0, 0, 1, 1, 1],
  [2, 2, 1, 1, 1],
  [1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1],
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2],
  [1, 0, 1, 2, 1],
  [1, 2, 1, 0, 1],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [0, 0, 0, 1, 2],
  [2, 2, 2, 1, 0],
  [0, 1, 2, 2, 2],
  [2, 1, 0, 0, 0],
  [1, 0, 0, 1, 1],
  [1, 2, 2, 1, 1],
];

function buildPaylines() {
  const seen = new Set();
  const lines = [];
  const add = (line) => {
    const key = line.join('');
    if (lines.length >= LINES || seen.has(key)) return;
    seen.add(key);
    lines.push(line);
  };
  SEED_LINES.forEach(add);
  SEED_LINES.forEach((line) => add(line.map((row) => 2 - row)));
  SEED_LINES.forEach((line) => add(line.map((row) => (row + 1) % 3)));
  SEED_LINES.forEach((line) => add(line.map((row) => (row + 2) % 3)));
  return lines;
}

export const PAYLINES = buildPaylines();

export function spinReels() {
  const pool = [];
  SYMBOLS.forEach((symbol) => {
    for (let index = 0; index < symbol.weight; index += 1) pool.push(symbol.id);
  });
  const grid = [];
  for (let reel = 0; reel < 5; reel += 1) {
    const column = [];
    for (let row = 0; row < 3; row += 1) column.push(pool[Math.floor(Math.random() * pool.length)]);
    grid.push(column);
  }
  return grid;
}

export function evaluateGrid(grid, bet) {
  const wins = [];
  let total = 0;

  PAYLINES.forEach((line, index) => {
    const cells = line.map((row, reel) => ({ reel, row, symbol: grid[reel][row] }));
    let base = null;
    let count = 0;
    for (let position = 0; position < cells.length; position += 1) {
      const cell = cells[position];
      const definition = SYMBOL_MAP[cell.symbol];
      if (definition.scatter) break;
      if (definition.wild) {
        count += 1;
        continue;
      }
      if (base === null) {
        base = cell.symbol;
        count += 1;
        continue;
      }
      if (cell.symbol === base) {
        count += 1;
        continue;
      }
      break;
    }
    const target = base || 'lion';
    if (count >= 3) {
      const definition = SYMBOL_MAP[target];
      const amount = definition.pays[count - 3] * bet;
      total += amount;
      wins.push({ line: index + 1, symbol: target, count, amount, cells: cells.slice(0, count) });
    }
  });

  const scatterCells = [];
  grid.forEach((column, reel) => {
    column.forEach((symbol, row) => {
      if (symbol === 'free') scatterCells.push({ reel, row });
    });
  });
  if (scatterCells.length >= 3) {
    const definition = SYMBOL_MAP.free;
    const amount = definition.pays[Math.min(scatterCells.length, 5) - 3] * bet * 5;
    total += amount;
    wins.push({ line: 0, symbol: 'free', count: scatterCells.length, amount, cells: scatterCells });
  }

  return { total, wins };
}