import { useEffect, useRef, useState } from 'react';

const EDGE = 'M7 4 L23 3 27 7 39 2 45 5 61 3 67 7 79 2 94 5 97 19 93 25 98 37 94 45 98 58 94 65 98 79 95 95 82 97 75 93 62 98 54 94 41 98 34 94 21 98 5 94 3 80 7 73 2 60 6 53 2 39 7 32 3 19 Z';

export default function DedeStorm({ orbs, spinKey, rolling, grid }) {
  const [impact, setImpact] = useState(null);
  const timer = useRef(null);
  const latest = useRef({ orbs, grid });
  latest.current = { orbs, grid };
  const orbKey = (orbs || []).map(o => `${o.reel}:${o.row}:${o.value}`).join('-');
  useEffect(() => {
    if (rolling || !orbKey || !spinKey) return;
    clearTimeout(timer.current);
    setImpact({ orbs: latest.current.orbs, cols: latest.current.grid?.length || 6, rows: latest.current.grid?.[0]?.length || 5, cue: `${spinKey}:${orbKey}:${Date.now()}` });
    timer.current = setTimeout(() => setImpact(null), 2200);
  }, [rolling, spinKey, orbKey]);
  useEffect(() => () => clearTimeout(timer.current), []);
  if (!impact) return null;
  const { cols, rows, cue } = impact;
  return (
    <svg key={cue} className="dede-storm dede-title" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
      <rect width="1000" height="1000" fill="currentColor" opacity="0.12" />
      <g className="dede-storm-edges" fill="none" stroke="currentColor" strokeLinejoin="round">
        {Array.from({ length: cols * rows }, (_, i) => (
          <svg key={i} x={(i % cols) * 1000 / cols} y={Math.floor(i / cols) * 1000 / rows} width={1000 / cols} height={1000 / rows} viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d={EDGE} className="dede-storm-edge-glow" />
            <path d={EDGE} className="dede-storm-edge-core" />
          </svg>
        ))}
      </g>
      <g className="dede-storm-bolts" fill="none" stroke="currentColor" strokeWidth="7" strokeLinejoin="round">
        {impact.orbs.map((orb, i) => {
          const x = (orb.reel + 0.5) * 1000 / cols;
          const y = (orb.row + 0.5) * 1000 / rows;
          const bolt = `M940 -20 L870 80 920 115 ${x + 80} ${y * 0.45} ${x + 120} ${y * 0.55} ${x} ${y}`;
          return <g key={i}>
            <path d={bolt} strokeWidth="22" opacity=".35" />
            <path d={bolt} />
            <path d={`M${x + 80} ${y * .45} l-110 55 45 35 -100 90 M${x + 120} ${y * .55} l130 20 -40 45 100 65`} strokeWidth="4" />
          </g>;
        })}
      </g>
    </svg>
  );
}