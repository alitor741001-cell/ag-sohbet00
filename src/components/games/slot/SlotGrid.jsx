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
    <div className="slot-metal rounded-2xl p-2">
      <div className="grid grid-cols-5 gap-1.5">
        {columns.map((column, reel) => (
          <div key={reel} className="flex flex-col gap-1.5">
            {column.map((id, row) => {
              const key = `${reel}-${row}`;
              const isWin = winCells.indexOf(key) >= 0;
              return (
                <div
                  key={key}
                  className={`slot-cell flex aspect-square items-center justify-center overflow-hidden rounded-lg ${
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
    </div>
  );
}