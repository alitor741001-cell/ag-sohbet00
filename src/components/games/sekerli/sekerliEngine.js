// ŞEKERLİ MEYVE motoru: ızgara üretimi, kazanç hesabı ve takla (tumble) zinciri.
// Tamamı istemcide çalışır; demo kredi dışında hiçbir sunucu işlemi yoktur.

import {
  LINES,
  PAYLINES,
  PAYTABLE,
  REELS,
  ROWS,
  SCATTER,
  SCATTER_FREE,
  SCATTER_PAY,
  WILD,
  randomSymbol,
} from './sekerliConfig';

// Her hücreye benzersiz kimlik verilir: düşen semboller animasyon için ayırt edilir.
let uidSeq = 0;
const makeCell = (sym) => {
  uidSeq += 1;
  return { uid: `sl-${uidSeq}`, sym };
};

export const EMPTY_CELLS = new Set();

/** Yeni ızgara: 5 sütun x 4 satır, her sütun yukarıdan aşağı dizilir. */
export function createGrid() {
  return Array.from({ length: REELS }, () =>
    Array.from({ length: ROWS }, () => makeCell(randomSymbol())),
  );
}

/** Satırdaki hücrenin yerini taşıyan anahtar. */
const key = (reel, row) => `${reel}-${row}`;

/**
 * Kazanç hesabı: her ödeme satırında soldan sağa 3+ aynı sembol (gökkuşağı joker).
 * Dönüş değerleri satır başına bahis birimindedir; yıldız ödemesi toplam bahis birimindedir.
 */
export function evaluateGrid(grid) {
  const scatterCells = [];
  let scatterCount = 0;

  for (let reel = 0; reel < REELS; reel += 1) {
    for (let row = 0; row < ROWS; row += 1) {
      if (grid[reel][row].sym === SCATTER) {
        scatterCount += 1;
        scatterCells.push(key(reel, row));
      }
    }
  }

  const cells = new Set();
  let lineTotal = 0;

  PAYLINES.slice(0, LINES).forEach((line) => {
    const first = grid[0][line[0]].sym;
    // Satır jokerle başlarsa ödeme ilk gerçek sembole göre yapılır.
    const sym = first === WILD
      ? line.map((row, reel) => grid[reel][row].sym).find((id) => id !== WILD && id !== SCATTER) || WILD
      : first;
    if (sym === SCATTER) return;

    let count = 0;
    for (let reel = 0; reel < REELS; reel += 1) {
      const id = grid[reel][line[reel]].sym;
      if (id === sym || id === WILD) count += 1;
      else break;
    }

    const pay = PAYTABLE[sym]?.[count];
    if (!pay) return;
    lineTotal += pay;
    for (let reel = 0; reel < count; reel += 1) cells.add(key(reel, line[reel]));
  });

  const freeSpins = SCATTER_FREE[scatterCount] || 0;
  return {
    lineTotal,
    scatterPay: SCATTER_PAY[scatterCount] || 0,
    freeSpins,
    cells,
    // Bonus tetikleyen yıldızlar da temizlenir: aynı yıldızlar iki kez sayılmaz.
    scatterCells: freeSpins > 0 ? scatterCells : [],
  };
}

/** Patlayan hücreler temizlenir, üstten yenileri düşer; düşen hücreler ayrıca bildirilir. */
export function collapseGrid(grid, cleared) {
  const added = new Set();
  const next = grid.map((column, reel) => {
    const kept = column.filter((_, row) => !cleared.has(key(reel, row)));
    const fresh = Array.from({ length: ROWS - kept.length }, () => {
      const cell = makeCell(randomSymbol());
      added.add(cell.uid);
      return cell;
    });
    return [...fresh, ...kept];
  });
  return { grid: next, added };
}