import React, { useMemo } from 'react';
import EliminReel from './EliminReel';
import { randomGrid } from './eliminConfig';

/** Oyun alanı: 6 sütun x 5 satır kare kart ızgarası. */
export default function EliminGrid({ spinning, stopping, landing, spinKey, grid, wins }) {
  // Tur başlamadan ekranda duran süs ızgarası.
  const fallback = useMemo(() => randomGrid(), []);
  const visible = grid || fallback;
  const moving = spinning && !stopping;

  // Kazanan kareler: makaralar durduktan sonra ışıkla işaretlenir.
  const winCells = useMemo(() => {
    const cells = new Set();
    if (moving) return cells;
    (wins || []).forEach((item) => {
      (item.cells || []).forEach((cell) => cells.add(`${cell.reel}-${cell.row}`));
    });
    return cells;
  }, [moving, wins]);

  return (
    <div className="el-board">
      {visible.map((column, reel) => (
        <EliminReel
          key={reel}
          reel={reel}
          column={column}
          landing={landing?.[reel] || null}
          spinning={spinning}
          stopping={stopping}
          winCells={winCells}
          spinKey={spinKey}
        />
      ))}
    </div>
  );
}