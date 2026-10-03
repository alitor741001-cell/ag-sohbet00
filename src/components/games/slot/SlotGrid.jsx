import React, { useMemo } from 'react';
import SlotSymbol from './SlotSymbol';
import { randomColumn } from './slotSymbols';

export default function SlotGrid({ grid, rollingReels, tick, winCells }) {
  const rolling = useMemo(() => new Set(rollingReels), [rollingReels]);
  const columns = useMemo(
    () => grid.map((column, index) => (rolling.has(index) ? randomColumn() : column)),
    // tick: dönen makaralarda sembollerin sürekli değişmesi için tetikleyici
    [grid, rolling, tick]
  );

  return (
    <div className="grid h-full grid-cols-5 gap-1">
      {columns.map((column, reel) => (
        <div key={reel} className="slot-reel-column flex h-full min-h-0 flex-col gap-1 rounded-lg py-1">
          {column.map((id, row) => {
            const key = `${reel}-${row}`;
            const isWin = winCells.indexOf(key) >= 0;
            return (
              <div
                key={key}
                className={`slot-cell flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md ${
                  isWin ? 'slot-cell-win' : ''
                } ${rolling.has(reel) ? 'slot-rolling' : ''}`}
              >
                <SlotSymbol id={id} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}