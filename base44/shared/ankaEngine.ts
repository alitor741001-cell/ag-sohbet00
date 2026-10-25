export const ANKA_BETS = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000];
export const ANKA_LINES = 20;
export const ANKA_PRIZES = { GRAND: 1000, MAJOR: 150, MINOR: 50, MINI: 25 };
const symbols = ['cup', 'lantern', 'bag', 'egg', 'coin', 'phoenix'];
const weights = [30, 25, 20, 13, 8, 4];
const pays = [0.12, 0.18, 0.3, 0, 1.2, 2];
function random() { return crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296; }
function symbol() {
  let value = random() * 100;
  for (let i = 0; i < weights.length; i++) { value -= weights[i]; if (value < 0) return symbols[i]; }
  return 'cup';
}
export function playAnka(stake) {
  const grid = [3, 5, 3].map(rows => Array.from({ length: rows }, symbol));
  const wins = [];
  let total = 0;
  for (let i = 0; i < symbols.length; i++) {
    const id = symbols[i];
    if (!pays[i]) continue;
    const matches = grid.map(column => column.flatMap((s, row) => s === id ? [row] : []));
    const ways = matches.reduce((value, rows) => value * rows.length, 1);
    if (!ways) continue;
    const amount = Math.round(stake * pays[i] * ways);
    total += amount;
    wins.push({ symbol: id, ways, amount, cells: matches.flatMap((rows, reel) => rows.map(row => ({ reel, row }))) });
  }
  const eggs = grid.flat().filter(s => s === 'egg').length;
  const free_spins = eggs >= 3 ? 8 : 0;
  let jackpot = null;
  if (wins.some(w => w.symbol === 'phoenix')) {
    const roll = random();
    const tier = roll < 0.005 ? 'GRAND' : roll < 0.04 ? 'MAJOR' : roll < 0.2 ? 'MINOR' : 'MINI';
    const amount = stake * ANKA_PRIZES[tier];
    total += amount;
    jackpot = { tier, amount };
  }
  return { grid, wins, win: total, free_spins_awarded: free_spins, jackpot };
}