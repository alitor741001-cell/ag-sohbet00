/** Patlayan karoların yerine üstten yenileri düşer; kalanlar aşağı kayar.
    Bütün tumbler oyunları (dede, meyve, şeker, eliminslot) bu dizilimden geçer. */
export function collapseColumns(
  grid: string[][],
  removing: Set<string>,
  rows: number,
  makeCell: () => string,
) {
  return grid.map((column, reel) => {
    const kept = column.filter((_, row) => !removing.has(`${reel}-${row}`));
    const fresh = [];
    for (let index = kept.length; index < rows; index += 1) fresh.push(makeCell());
    return [...fresh, ...kept];
  });
}