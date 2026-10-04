import React, { useEffect, useMemo, useState } from 'react';
import { SYMBOL_IDS } from '@/components/games/lucky/luckyConfig';
import LuckyFallingColumn from '@/components/games/lucky/LuckyFallingColumn';

/** Individual downward drops, not a continuous reel strip. Server results remain unchanged. */
export default function LuckyReels({ grid, multiValues, spinning, spinId }) {
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    if (!spinning) return;
    setCycle(0);
    const timer = window.setInterval(() => setCycle((value) => value + 1), 1600);
    return () => window.clearInterval(timer);
  }, [spinning, spinId]);
  const randomGrid = useMemo(() => Array.from({ length: 5 }, () =>
    Array.from({ length: 4 }, () => SYMBOL_IDS[Math.floor(Math.random() * SYMBOL_IDS.length)])
  ), [spinId, cycle]);
  if (!grid && !spinning) return null;
  const symbols = spinning ? randomGrid : grid;
  if (!symbols) return null;
  const wave = spinning ? `${spinId}:${cycle}` : `${spinId}:result`;
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[0.7rem] border border-slot-gold/60 bg-slot-panel shadow-[inset_0_0_18px_rgba(0,0,0,0.75)]">
      <div className="absolute inset-0 grid grid-cols-5 gap-[2px] p-[2px]">
        {symbols.map((column, index) => (
          <LuckyFallingColumn key={index} column={index} symbols={column}
            multipliers={spinning ? null : multiValues?.[index]} wave={wave} spinning={spinning} />
        ))}
      </div>
    </div>
  );
}