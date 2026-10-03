import React, { useLayoutEffect, useRef, useState } from 'react';
import SlotSymbol from '@/components/games/slot/SlotSymbol';

export default function SlotReelColumn({ index, random, landing, stopping, slow }) {
  const stripRef = useRef(null);
  const [finish, setFinish] = useState(null);
  const loop = [...random, ...random];
  useLayoutEffect(() => {
    if (!stopping || !stripRef.current) return;
    const strip = stripRef.current;
    const transform = new DOMMatrixReadOnly(getComputedStyle(strip).transform);
    const cellHeight = strip.getBoundingClientRect().height / loop.length;
    const position = Math.max(0, -transform.m42 / cellHeight);
    const start = Math.floor(position);
    // Preserve the visible symbols and their exact offset at the stop click.
    const visible = loop.slice(start, start + 4);
    const tiles = [...landing, ...random.slice(0, 6), ...visible];
    setFinish({ tiles, from: -(9 + position - start) / tiles.length * 100 });
  }, [stopping]);
  const tiles = finish?.tiles || loop;
  return <span className="absolute top-0 h-full overflow-hidden" style={{ left: `${index * 20}%`, width: '20%' }}>
    <span ref={stripRef} key={finish ? 'finish' : 'loop'}
      className={`absolute left-0 top-0 w-full ${finish ? 'slot-reel-settle' : 'slot-reel-loop'}`}
      style={{ height: `${tiles.length / 3 * 100}%`, '--reel-from': `${finish?.from || 0}%`,
        animationDuration: `${finish ? 0.36 + index * 0.1 : (0.85 + index * 0.065) * (slow ? 2.3 : 1)}s` }}>
      {tiles.map((symbol, i) => <SlotSymbol key={i} symbol={symbol} top={`${i / tiles.length * 100}%`} height={`${100 / tiles.length}%`} />)}
    </span>
  </span>;
}