import { useEffect, useMemo, useRef } from 'react';

/**
 * Patlayanların yerine inen karolar: sembolü değişen her hücre kayma
 * animasyonuyla gelir. Izgara akarken (rolling) hiçbir hücre işaretlenmez.
 */
export default function useCellDrops({ grid, rolling, landing }) {
  const previous = useRef(grid);

  const drops = useMemo(() => {
    const set = new Set();
    if (rolling) return set;
    const before = previous.current;
    grid.forEach((column, reel) => {
      column.forEach((symbol, row) => {
        if (before?.[reel]?.[row] !== symbol) set.add(`${reel}-${row}`);
      });
    });
    return set;
  }, [grid, rolling]);

  useEffect(() => {
    // İniş tamamlandı: dizilim zaten ekranda, karolar yeniden düşmez.
    if (landing) previous.current = landing;
    else if (!rolling) previous.current = grid;
  }, [grid, landing, rolling]);

  return drops;
}