import React, { useEffect, useMemo, useRef } from 'react';
import EliminReel from './EliminReel';
import { randomGrid } from './eliminConfig';
import useCellDrops from '@/components/games/reels/useCellDrops';

/** Oyun alanı: 6 sütun x 5 satır kare kart ızgarası. */
export default function EliminGrid({ spinning, stopping, landing, spinKey, grid, wins, explode }) {
  // Tur başlamadan ekranda duran süs ızgarası.
  const fallback = useMemo(() => randomGrid(), []);
  const visible = grid || fallback;
  const moving = spinning && !stopping;
  // Patlayanların yerine düşen kartlar değişen hücrelerdir: kayma animasyonuyla gelirler.
  const drops = useCellDrops({ grid: visible, rolling: moving, landing });
  // Kalkışta ekranda duran dizilim: makaralar bu kartlardan kalkar.
  const shownRef = useRef(visible);
  useEffect(() => {
    if (!moving) shownRef.current = visible;
  }, [moving, visible]);

  // Kazanan kareler: makaralar durduktan sonra ışıkla işaretlenir.
  const winCells = useMemo(() => {
    const cells = new Set();
    if (moving) return cells;
    (wins || []).forEach((item) => {
      (item.cells || []).forEach((cell) => cells.add(`${cell.reel}-${cell.row}`));
    });
    return cells;
  }, [moving, wins]);

  // Patlayan kareler: altın muz (skatter) yerinde durur.
  const explodeCells = useMemo(() => {
    const cells = new Set();
    (wins || []).forEach((item) => {
      if (item.scatter) return;
      (item.cells || []).forEach((cell) => cells.add(`${cell.reel}-${cell.row}`));
    });
    return cells;
  }, [wins]);

  return (
    <div className="el-board">
      {visible.map((column, reel) => (
        <EliminReel
          key={reel}
          reel={reel}
          column={column}
          initial={shownRef.current?.[reel]}
          landing={landing?.[reel] || null}
          spinning={spinning}
          stopping={stopping}
          winCells={winCells}
          explodeCells={explodeCells}
          explode={explode}
          drops={drops}
          spinKey={spinKey}
        />
      ))}
    </div>
  );
}