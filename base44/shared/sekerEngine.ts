import { collapseColumns } from './tumble.ts';

// Şeker oyunu motoru: 6 sütun x 6 satır, "aynı şeker ekranın her yerinde öder" kuralı.
// Meyve oyunuyla aynı ekonomi: aynı bahis kademeleri, aynı 20X toplam bahis.
export const REELS = 6;
export const ROWS = 6;

// Toplam bahis = bahis x 20 (referanstaki 20X kademesi).
export const LINES = 20;

// Bahis kademeleri.
export const BET_LEVELS = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000];

// Ödeme oranı: 36 karede kümeler daha sık oluştuğu için tur başına geri dönüş
// meyve oyunuyla aynı seviyede (~%74) kalsın diye bu oran kullanılır.
export const PAYOUT_RATE = 0.41;

// Toplam bahsin bu katı ve üzeri kazançlar "büyük kazanç" sayılır.
export const BIG_WIN_MULTIPLE = 10;

// Küme ödemesi: ekranda en az bu kadar aynı şeker olunca öder.
export const CLUSTER_MIN = 10;

// Bir turdaki en fazla tumbler adımı: patlayan kümelerin yerine yenileri düşer.
export const DROP_MAX = 8;

// Altın şeker: 4 ve üzeri gelince hem bonus öder hem bedava tur verir.
export const SCATTER_ID = 'golden';
export const SCATTER_MIN = 4;
export const FREE_SPINS = 10;
// Torbaya giren altın şeker sayısı: meyve oyunundaki sıklığa denk gelir.
export const SCATTER_WEIGHT = 2;
// Skatter ödemesi: 4, 5 ve 6+ altın şeker için bahis katı.
export const SCATTER_PAYS = [54, 108, 216];

// pays: küme kademeleri (10-11, 12-13 ve 14+ şeker) için bahis katı.
export const SYMBOLS = [
  { id: 'flower', name: 'Mor Çiçek', weight: 8, pays: [144, 450, 1440] },
  { id: 'sphere', name: 'Mavi Top', weight: 10, pays: [90, 270, 900] },
  { id: 'bean', name: 'Kırmızı Fasulye', weight: 12, pays: [72, 216, 630] },
  { id: 'oval', name: 'Turuncu Şeker', weight: 14, pays: [54, 162, 450] },
  { id: 'square', name: 'Yeşil Küp', weight: 16, pays: [36, 108, 324] },
  { id: 'drop', name: 'Sarı Damla', weight: 20, pays: [18, 54, 162] },
];

// Şeker torbası: her şeker ağırlığı kadar yazılır.
function buildPool() {
  const pool = [];
  SYMBOLS.forEach((symbol) => {
    for (let index = 0; index < symbol.weight; index += 1) pool.push(symbol.id);
  });
  for (let index = 0; index < SCATTER_WEIGHT; index += 1) pool.push(SCATTER_ID);
  return pool;
}

const POOL = buildPool();

// Tek şeker: torbadan gelir.
export function spinCell() {
  return POOL[Math.floor(Math.random() * POOL.length)];
}

// 6 sütun x 6 satır sonuç: grid[sütun][satır].
export function spinSeker(makeCell = spinCell) {
  const grid = [];
  for (let reel = 0; reel < REELS; reel += 1) {
    const column = [];
    for (let row = 0; row < ROWS; row += 1) column.push(makeCell());
    grid.push(column);
  }
  return grid;
}

/** Bir turun tamamı: ilk tahta ve patlayan kümelerin yerine yenilerinin düştüğü adımlar.
    Her adım ekranda ayrı oynanır; altın şeker ödemesi yalnızca ilk adımda verilir. */
export function playSeker(bet) {
  let grid = spinSeker();
  const initial = grid.map((column) => [...column]);
  const steps = [];
  let total = 0;

  for (let step = 0; step < DROP_MAX; step += 1) {
    const result = evaluateSeker(grid, bet);
    // Altın şeker yerinde durur: skatter ödemesi tekrar etmez.
    const wins = step === 0 ? result.wins : result.wins.filter((win) => !win.scatter);
    if (!wins.length) break;
    const amount = wins.reduce((sum, win) => sum + win.amount, 0);
    steps.push({ grid: grid.map((column) => [...column]), wins, amount });
    total += amount;

    // Patlayan şekerler: altın şeker yerinde kalır.
    const removing = new Set<string>();
    wins.forEach((win) => {
      if (win.scatter) return;
      win.cells.forEach((cell) => removing.add(`${cell.reel}-${cell.row}`));
    });
    if (!removing.size) break;
    grid = collapseColumns(grid, removing, ROWS, spinCell);
  }

  return { steps, grid, initial, total };
}

function clusterTier(count, pays) {
  if (count >= CLUSTER_MIN + 4) return pays[2];
  if (count >= CLUSTER_MIN + 2) return pays[1];
  return pays[0];
}

// Ekrandaki bütün eşleşmeler: şeker kümeleri ve altın şeker.
export function evaluateSeker(grid, bet) {
  const wins = [];
  const counts = {};
  const cells = {};
  let total = 0;

  grid.forEach((column, reel) => {
    column.forEach((symbol, row) => {
      counts[symbol] = (counts[symbol] || 0) + 1;
      if (!cells[symbol]) cells[symbol] = [];
      cells[symbol].push({ reel, row });
    });
  });

  SYMBOLS.forEach((definition) => {
    const count = counts[definition.id] || 0;
    if (count < CLUSTER_MIN) return;
    const amount = Math.round(clusterTier(count, definition.pays) * bet * PAYOUT_RATE);
    total += amount;
    wins.push({ symbol: definition.id, count, amount, cells: cells[definition.id], scatter: false });
  });

  const scatterCount = counts[SCATTER_ID] || 0;
  if (scatterCount >= SCATTER_MIN) {
    const tier = Math.min(scatterCount, SCATTER_MIN + 2) - SCATTER_MIN;
    const amount = Math.round(SCATTER_PAYS[tier] * bet * PAYOUT_RATE);
    total += amount;
    wins.push({
      symbol: SCATTER_ID,
      count: scatterCount,
      amount,
      cells: cells[SCATTER_ID],
      scatter: true,
    });
  }

  return { total, wins };
}