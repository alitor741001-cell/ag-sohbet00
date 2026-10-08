import React, { useMemo } from 'react';
import FruitSymbol from './FruitSymbol';
import { FRUIT_SYMBOLS, randomGrid } from './fruitConfig';

/**
 * Sonuç ızgarası: 6 sütun x 5 satır. Tur sırasında her sütun kendi hızında
 * aşağı akar; tur bitince karolar yerine oturur ve kazanan küme parlar.
 */
export default function FruitReels({ spinning, stopping, grid, wins }) {
  // Tur başlamadan ekranda duran süs ızgarası.
  const fallback = useMemo(() => randomGrid(), []);
  const visible = grid || fallback;
  const moving = spinning && !stopping;

  const winCells = useMemo(() => {
    const cells = new Set();
    if (moving) return cells;
    (wins || []).forEach((item) => {
      (item.cells || []).forEach((cell) => cells.add(`${cell.reel}-${cell.row}`));
    });
    return cells;
  }, [moving, wins]);

  // Akan şerit: sütunun iki kopyası — döngü kesintisiz olur.
  const strips = useMemo(() => visible.map((column) => [...column, ...column]), [visible]);

  return (
    <div className="flex h-full w-full items-stretch gap-[3px] sm:gap-1.5">
      {visible.map((column, reel) => (
        <div
          key={reel}
          className="fruit-column min-w-0 flex-1 rounded-xl bg-white/30 p-[2px] sm:rounded-2xl sm:p-1"
        >
          {moving ? (
            <div className="fruit-strip" style={{ animationDuration: `${420 + reel * 60}ms` }}>
              {strips[reel].map((id, index) => (
                <span key={index} className="fruit-cell">
                  <FruitSymbol id={id} />
                </span>
              ))}
            </div>
          ) : (
            column.map((id, row) => (
              <span key={row} className="fruit-cell fruit-settle">
                <FruitSymbol
                  id={id}
                  win={winCells.has(`${reel}-${row}`)}
                  scatter={FRUIT_SYMBOLS[id]?.scatter}
                />
              </span>
            ))
          )}
        </div>
      ))}
    </div>
  );
}