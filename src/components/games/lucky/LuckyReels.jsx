import React, { useMemo } from 'react';
import { SYMBOL_IDS } from '@/components/games/lucky/luckyConfig';
import LuckySymbol from '@/components/games/lucky/LuckySymbol';
import SlotReelColumn from '@/components/games/slot/SlotReelColumn';
import '@/components/games/slot/slotReels.css';

/** Shares Slot Frenzy's reel movement and stop-position calculation. */
export default function LuckyReels({ grid, multiValues, spinning, spinId }) {
  const strips = useMemo(() => Array.from({ length: 5 }, () =>
    Array.from({ length: 15 }, () => SYMBOL_IDS[Math.floor(Math.random() * SYMBOL_IDS.length)])
  ), [spinId]);
  if (!grid && !spinning) return null;
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[0.7rem] border border-slot-gold/60 bg-slot-panel shadow-[inset_0_0_18px_rgba(0,0,0,0.75)]">
      {strips.map((random, column) => (
        <SlotReelColumn key={`${spinId}:${column}`} index={column} random={random}
          rows={4} stopping={!spinning} slow={false}
          landing={grid?.[column] || random.slice(0, 4)}
          renderTile={(symbol, row, top, height, settled) => (
            <span className="absolute left-0 block w-full" style={{ top, height }}>
              <LuckySymbol symbol={symbol}
                multiplier={settled && row < 4 ? multiValues?.[column]?.[row] : null} />
            </span>
          )}
        />
      ))}
    </div>
  );
}