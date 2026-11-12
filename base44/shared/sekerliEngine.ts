// ŞEKERLİ MEYVE motoru: 5 sütun x 4 satır, 20 ödeme satırı ve takla (tumble) zinciri.
// Turun sonucu ve zincirin bütün adımları sunucuda üretilir; ekran yalnızca canlandırır.

export const REELS = 5;
export const ROWS = 4;

// Toplam bahis = bahis x 20 (uygulamadaki diğer oyunlarla aynı kademe).
export const LINES = 20;

// Bahis kademeleri: bütün oyunlarda ortak.
export const BET_LEVELS = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000];

export const WILD = 'rainbow';
export const SCATTER = 'star';

// Çekiliş ağırlıkları: düşük semboller sık, özel semboller seyrek gelir.
const WEIGHTS = { pink: 22, blue: 20, yellow: 17, green: 14, heart: 11, lolli: 8, rainbow: 5, star: 3 };
const BAG = [];
Object.keys(WEIGHTS).forEach((id) => {
  for (let index = 0; index < WEIGHTS[id]; index += 1) BAG.push(id);
});

// Satır ödemesi: soldan sağa 3/4/5 aynı sembol için bahis katsayısı.
export const PAYTABLE = {
  pink: { 3: 3, 4: 9, 5: 28 },
  blue: { 3: 3, 4: 13, 5: 35 },
  yellow: { 3: 5, 4: 15, 5: 43 },
  green: { 3: 5, 4: 19, 5: 60 },
  heart: { 3: 6, 4: 35, 5: 119 },
  lolli: { 3: 13, 4: 60, 5: 236 },
  [WILD]: { 3: 13, 4: 60, 5: 236 },
};

// Yıldız: 3 ve üzeri gelince toplam bahis üzerinden öder (bedava tur vermez).
export const SCATTER_PAY = { 3: 2, 4: 10, 5: 50 };

// 20 ödeme satırı: her satır 5 sütunun satır indekslerini taşır.
export const PAYLINES = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [3, 3, 3, 3, 3],
  [0, 1, 2, 1, 0],
  [3, 2, 1, 2, 3],
  [1, 0, 1, 2, 1],
  [2, 3, 2, 1, 2],
  [0, 0, 1, 2, 3],
  [3, 3, 2, 1, 0],
  [1, 2, 2, 2, 1],
  [2, 1, 1, 1, 2],
  [0, 1, 1, 1, 0],
  [3, 2, 2, 2, 3],
  [1, 1, 2, 1, 1],
  [2, 2, 1, 2, 2],
  [0, 2, 1, 2, 0],
  [3, 1, 2, 1, 3],
  [1, 3, 2, 3, 1],
  [2, 0, 2, 0, 2],
];

// Takla zinciri çarpanı: her yeni kazanç dalgasında bir kademe yükselir.
export const CASCADE_MULT = [1, 1, 1, 2, 2];

export function randomSymbol() {
  return BAG[Math.floor(Math.random() * BAG.length)];
}

// Sonuç ızgarası: grid[sütun][satır].
export function createGrid() {
  const grid = [];
  for (let reel = 0; reel < REELS; reel += 1) {
    const column = [];
    for (let row = 0; row < ROWS; row += 1) column.push(randomSymbol());
    grid.push(column);
  }
  return grid;
}

// Tek satır: soldan sağa eşleşme; joker eksik sembolün yerine geçer.
function lineResult(grid, line) {
  const head = grid[0][line[0]];
  const symbol = head === WILD ? grid[1][line[1]] : head;
  let count = 0;
  for (let reel = 0; reel < REELS; reel += 1) {
    const value = grid[reel][line[reel]];
    if (value === symbol || value === WILD) count += 1;
    else break;
  }
  // Jokerle başlayan satırda joker sayısı ödemeyi yükseltir: kendi kademesi uygulanır.
  let wilds = 0;
  for (let reel = 0; reel < count; reel += 1) {
    if (grid[reel][line[reel]] === WILD) wilds += 1;
  }
  if (count < 3) return { count: 0, pay: 0 };
  const tiers = symbol === WILD || wilds === count ? PAYTABLE[WILD] : PAYTABLE[symbol];
  if (!tiers) return { count: 0, pay: 0 };
  return { count, pay: tiers[count] || 0 };
}

// Ekrandaki kazanç: satırlar, yıldız ödemesi ve patlayacak kareler.
export function evaluateGrid(grid) {
  let units = 0;
  const cells = new Map();
  PAYLINES.forEach((line) => {
    const { count, pay } = lineResult(grid, line);
    if (pay <= 0) return;
    units += pay;
    for (let reel = 0; reel < count; reel += 1) {
      const row = line[reel];
      cells.set(`${reel}-${row}`, { reel, row });
    }
  });

  const scatterCells = [];
  grid.forEach((column, reel) => {
    column.forEach((symbol, row) => {
      if (symbol === SCATTER) scatterCells.push({ reel, row });
    });
  });
  const scatterCount = scatterCells.length;
  if (scatterCount >= 3) units += (SCATTER_PAY[Math.min(5, scatterCount)] || 0) * LINES;

  // Kazanan kareler ve ekrandaki yıldızlar patlar; yerlerine yenileri düşer.
  const cleared = new Map(cells);
  scatterCells.forEach((cell) => cleared.set(`${cell.reel}-${cell.row}`, cell));

  return { units, cells: [...cells.values()], scatterCells, cleared: [...cleared.values()], scatterCount };
}

// Patlayan karelerin yerine üstten yeni semboller düşer.
export function collapseGrid(grid, cleared) {
  const removedByReel = new Map();
  cleared.forEach((cell) => {
    const list = removedByReel.get(cell.reel) || [];
    list.push(cell.row);
    removedByReel.set(cell.reel, list);
  });

  const next = [];
  const added = [];
  for (let reel = 0; reel < REELS; reel += 1) {
    const removed = removedByReel.get(reel) || [];
    const kept = [];
    for (let row = 0; row < ROWS; row += 1) {
      if (!removed.includes(row)) kept.push(grid[reel][row]);
    }
    const fresh = [];
    for (let index = 0; index < ROWS - kept.length; index += 1) fresh.push(randomSymbol());
    fresh.forEach((sym, index) => added.push({ reel, row: index, sym }));
    next.push([...fresh, ...kept]);
  }
  return { grid: next, added };
}

/**
 * Tur: takla zinciri baştan sona hesaplanır.
 * Her adım ekranda oynanacak kazancı, çarpanı ve patlayacak kareleri taşır.
 * units = satır bahsi katsayısı toplamı; coin karşılığı units x bahis.
 */
export function spinSekerli() {
  let grid = createGrid();
  const steps = [];
  let units = 0;

  for (let step = 0; step < 40; step += 1) {
    const result = evaluateGrid(grid);
    if (result.units <= 0) break;
    const multiplier = CASCADE_MULT[Math.min(step, CASCADE_MULT.length - 1)];
    units += result.units * multiplier;
    steps.push({
      grid,
      cells: result.cells,
      scatter_cells: result.scatterCells,
      multiplier,
      units: result.units,
    });
    if (!result.cleared.length) break;
    grid = collapseGrid(grid, result.cleared).grid;
  }

  // Zincir bittikten sonra ekranda kalan son ızgara.
  return { steps, final_grid: grid, units };
}