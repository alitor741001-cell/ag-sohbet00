import React, { useLayoutEffect, useRef, useState } from 'react';
import SlotSymbol from '@/components/games/slot/SlotSymbol';

export default function SlotReelColumn({ index, random, landing, stopping, slow, rows = 3, renderTile }) {
  const stripRef = useRef(null);
  const [finish, setFinish] = useState(null);
  const loop = [...random, ...random];
  // Gerçek makine gibi: makaralar soldan sağa sırayla durur.
  const [halt, setHalt] = useState(false);
  useLayoutEffect(() => {
    if (!stopping) { setHalt(false); return undefined; }
    const timer = window.setTimeout(() => setHalt(true), index * 230);
    return () => window.clearTimeout(timer);
  }, [stopping, index]);
  useLayoutEffect(() => {
    if (!halt || !stripRef.current) return;
    const strip = stripRef.current;
    const transform = new DOMMatrixReadOnly(getComputedStyle(strip).transform);
    const cellHeight = strip.getBoundingClientRect().height / loop.length;
    const position = Math.max(0, -transform.m42 / cellHeight);
    const start = Math.floor(position);
    // Preserve the visible symbols and their exact offset at the stop click.
    const visible = loop.slice(start, start + rows + 1);
    const tiles = [...landing, ...random.slice(0, 6), ...visible];
    setFinish({ tiles, from: -(landing.length + 6 + position - start) / tiles.length * 100 });
  }, [halt]);
  const tiles = finish?.tiles || loop;
  return <span className="slot-reel-strip absolute top-0 h-full overflow-hidden" style={{ left: `${index * 20}%`, width: '20%' }}>
    <span ref={stripRef} key={finish ? 'finish' : 'loop'}
      className={`absolute left-0 top-0 w-full ${finish ? 'slot-reel-settle' : 'slot-reel-loop'}`}
      style={{ height: `${tiles.length / rows * 100}%`, '--reel-from': `${finish?.from || 0}%`,
        animationDuration: `${finish ? 0.6 : (1.3 + index * 0.08) * (slow ? 2.3 : 1)}s` }}>
      {tiles.map((symbol, i) => renderTile
        ? <React.Fragment key={i}>{renderTile(symbol, i, `${i / tiles.length * 100}%`, `${100 / tiles.length}%`, Boolean(finish))}</React.Fragment>
        : <SlotSymbol key={i} symbol={symbol} top={`${i / tiles.length * 100}%`} height={`${100 / tiles.length}%`} />)}
    </span>
  </span>;
}