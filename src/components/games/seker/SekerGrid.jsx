import React, { useMemo } from 'react';
import SekerSymbol from './SekerSymbol';
import { SEKER_SYMBOLS, randomGrid } from './sekerConfig';

/**
 * Sonuç ızgarası: 6 sütun x 6 satır. Tur sırasında sütunlar aşağı akar; tur
 * bitince şekerler yerine oturur ve kazanan şekerler parlar.
 */
export default function SekerGrid({ spinning, stopping, grid, wins }) {
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
    <div className="seker-board flex h-full w-full items-stretch">
      {visible.map((column, reel) => (
        <div key={reel} className="seker-column">
          {moving ? (
            <div className="seker-strip" style={{ animationDuration: `${420 + reel * 60}ms` }}>
              {strips[reel].map((id, index) => (
                <span key={index} className="seker-cell">
                  <SekerSymbol id={id} />
                </span>
              ))}
            </div>
          ) : (
            column.map((id, row) => (
              <span key={row} className="seker-cell seker-settle">
                <SekerSymbol
                  id={id}
                  win={winCells.has(`${reel}-${row}`)}
                  scatter={SEKER_SYMBOLS[id]?.scatter}
                />
              </span>
            ))
          )}
        </div>
      ))}
    </div>
  );
}