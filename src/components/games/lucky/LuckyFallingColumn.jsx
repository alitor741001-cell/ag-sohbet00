import React, { useRef } from 'react';
import LuckySymbol from '@/components/games/lucky/LuckySymbol';
import useCompleteLuckyTiles from '@/components/games/lucky/useCompleteLuckyTiles';

export default function LuckyFallingColumn({ column, symbols, multipliers, wave, spinning }) {
  const columnRef = useRef(null);
  useCompleteLuckyTiles(columnRef, spinning, wave, 1200);
  return (
    <div ref={columnRef} className="relative h-full overflow-hidden">
      {symbols.map((symbol, row) => (
        <span
          key={`${wave}:${row}`}
          className="lucky-symbol-fall absolute left-0 block h-1/4 w-full"
          style={{
            top: `${row * 25}%`,
            animationDelay: `${column * 95 + (3 - row) * 65}ms`,
          }}
        >
          <LuckySymbol symbol={symbol} multiplier={multipliers?.[row]} />
        </span>
      ))}
    </div>
  );
}