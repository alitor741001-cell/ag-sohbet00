import React, { useEffect, useState } from 'react';
import { cutDarkBackground } from '@/lib/cutoutImage';
import { SLOT_SYMBOL_ART } from '@/components/games/slotAssets';
import { SLOT_LAYOUT, SYMBOL_IDS } from '@/components/games/slot/slotLayout';
import SlotSymbol from '@/components/games/slot/SlotSymbol';
import SlotReelColumn from '@/components/games/slot/SlotReelColumn';
import SlotReelBezel from '@/components/games/slot/SlotReelBezel';
import '@/components/games/slot/slotReels.css';

const randomRun = () => Array.from({ length: 15 }, () => SYMBOL_IDS[Math.floor(Math.random() * SYMBOL_IDS.length)]);

/** Makara penceresi: koyu yatak, beş ayrı şerit ve önlerinde kabin katmanı. */
export default function SlotReels({ spinning, stopping, slow, grid }) {
  const [strips, setStrips] = useState([]);
  useEffect(() => {
    setStrips(spinning ? Array.from({ length: 5 }, randomRun) : []);
  }, [spinning]);

  // Sembol zeminleri ekran açılırken bir kez kesilir: ilk turda boş hücre görünmez.
  useEffect(() => {
    Object.values(SLOT_SYMBOL_ART).forEach((url) => { cutDarkBackground(url).catch(() => {}); });
  }, []);
  if (!spinning && !grid) return null;
  return <div aria-hidden="true" className="pointer-events-none absolute overflow-hidden" style={SLOT_LAYOUT.reelWindow}>
    <span className="slot-reel-bed absolute inset-0" />

    {spinning && strips.length ? strips.map((random, index) => (
      <SlotReelColumn key={index} index={index} random={random} stopping={stopping} slow={slow}
        landing={[0, 1, 2].map(row => grid?.[index]?.[row] || 'ten')} />
    )) : grid && [0, 1, 2, 3, 4].map(col => (
      <span key={col} className="slot-reel-strip absolute top-0 h-full overflow-hidden" style={{ left: `${col * 20}%`, width: '20%' }}>
        {[0, 1, 2].map(row => <SlotSymbol key={row} symbol={grid[col]?.[row] || 'ten'} top={`${row / 3 * 100}%`} height="33.333%" />)}
      </span>
    ))}

    <SlotReelBezel />
  </div>;
}