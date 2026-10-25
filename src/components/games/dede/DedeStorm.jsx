const EDGE = 'M7 4 L23 3 27 7 39 2 45 5 61 3 67 7 79 2 94 5 97 19 93 25 98 37 94 45 98 58 94 65 98 79 95 95 82 97 75 93 62 98 54 94 41 98 34 94 21 98 5 94 3 80 7 73 2 60 6 53 2 39 7 32 3 19 Z';

export default function DedeStorm({ orbs, spinKey, rolling, grid }) {
  if (rolling || !orbs?.length) return null;
  const cols = grid?.length || 6;
  const rows = grid?.[0]?.length || 5;
  const cue = `${spinKey}-${orbs.map(o => `${o.reel}:${o.row}:${o.value}`).join('-')}`;
  return (
    <svg key={cue} className="dede-storm dede-title" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
      <g className="dede-storm-edges" fill="none" stroke="currentColor" strokeLinejoin="round">
        {Array.from({ length: cols * rows }, (_, i) => (
          <svg key={i} x={(i % cols) * 1000 / cols} y={Math.floor(i / cols) * 1000 / rows} width={1000 / cols} height={1000 / rows} viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d={EDGE} className="dede-storm-edge-glow" />
            <path d={EDGE} className="dede-storm-edge-core" />
          </svg>
        ))}
      </g>
      <g className="dede-storm-bolts" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
        {orbs.map((orb, i) => {
          const x = (orb.reel + 0.5) * 1000 / cols;
          const y = (orb.row + 0.5) * 1000 / rows;
          return <path key={i} d={`M940 -20 L870 80 920 115 ${x + 80} ${y * 0.45} ${x + 120} ${y * 0.55} ${x} ${y}`} />;
        })}
      </g>
    </svg>
  );
}