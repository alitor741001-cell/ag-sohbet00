import { REELS, ROWS, SYMBOL_IDS } from './sekerliConfig';

// Boş kare kümesi: kazanan/ yeni kare işaretleri bunun üzerinden yönetilir.
export const EMPTY_CELLS = new Set();

let uid = 0;
const nextUid = () => {
  uid += 1;
  return `k${uid}`;
};

/** Dönen şerit ve düşen yeni semboller için rastgele çekim (sonuç sunucudan gelir). */
export const randomSymbol = () => SYMBOL_IDS[Math.floor(Math.random() * SYMBOL_IDS.length)];

/** Sunucudan gelen ızgarayı taşınabilir karelere çevirir: grid[sütun][satır]. */
export function toBoard(grid) {
  if (!grid) return [];
  return grid.map((column) => column.map((sym) => ({ uid: nextUid(), sym })));
}

/** Patlayan karelerin yerine üstten yeniler düşer; kalan kareler kimliğini korur. */
export function collapseBoard(board, cleared) {
  const added = new Set();
  const next = board.map((column, reel) => {
    const kept = column.filter((cell, row) => !cleared.has(`${reel}-${row}`));
    const fresh = Array.from({ length: ROWS - kept.length }, (_, index) => {
      const cell = { uid: nextUid(), sym: randomSymbol() };
      added.add(cell.uid);
      return cell;
    });
    return [...fresh, ...kept];
  });
  return { board: next, added };
}

/** Düşen kareler sunucudan gelen ızgarayla eşitlenir: semboller tek kaynaktan gelir. */
export function mergeSymbols(board, grid) {
  if (!grid) return board;
  return board.map((column, reel) =>
    column.map((cell, row) => ({ uid: cell.uid, sym: grid[reel][row] ?? cell.sym })),
  );
}