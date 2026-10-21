import React from 'react';

/** Boş koltuk içi desenler: 30 koltuğa 30 ayrı geometrik süsleme. */

const TONES = [
  ['#f2d79c', '#b9964f'],
  ['#e9eff8', '#a4b6cb'],
  ['#d9e2df', '#8ea3a0'],
];

const SPECS = [
  [{ k: 'lines', a: 0, n: 7, gap: 12 }],
  [{ k: 'lines', a: 90, n: 7, gap: 12 }],
  [{ k: 'lines', a: 45, n: 8, gap: 14 }],
  [{ k: 'lines', a: 135, n: 8, gap: 14 }],
  [{ k: 'lines', a: 0, n: 4, gap: 17, dash: '16 10' }],
  [{ k: 'dots', n: 4, r: 3.4 }],
  [{ k: 'dots', n: 5, r: 2.4, off: true }],
  [{ k: 'dots', n: 3, r: 5 }],
  [{ k: 'ring', n: 2 }],
  [{ k: 'ring', n: 3, dash: '12 8' }],
  [{ k: 'poly', s: 6, n: 2 }],
  [{ k: 'poly', s: 3, n: 2, rot: 30 }],
  [{ k: 'poly', s: 8, n: 2, rot: 22.5 }],
  [{ k: 'rays', n: 12, inner: 26 }],
  [{ k: 'rays', n: 20, inner: 36 }],
  [{ k: 'rays', n: 8, inner: 46 }],
  [{ k: 'chev', n: 3, w: 24 }],
  [{ k: 'chev', n: 5, w: 16 }],
  [{ k: 'dia', n: 3, r: 11 }],
  [{ k: 'dia', n: 4, r: 7 }],
  [{ k: 'lat', gap: 16 }],
  [{ k: 'lat', gap: 10 }],
  [{ k: 'check', n: 4 }],
  [{ k: 'check', n: 6 }],
  [{ k: 'scale', n: 3 }],
  [{ k: 'scale', n: 4 }],
  [{ k: 'cross', n: 4 }],
  [{ k: 'arc', n: 3 }],
  [{ k: 'dots', n: 6, r: 1.8 }, { k: 'ring', n: 1 }],
  [{ k: 'rays', n: 16, inner: 22 }, { k: 'ring', n: 1 }],
];

const polyPoints = (sides, r, rot = 0) =>
  Array.from({ length: sides }, (_, i) => {
    const a = ((rot + (360 / sides) * i - 90) * Math.PI) / 180;
    return `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');

const grid = (n) => {
  const step = 100 / (n + 1);
  const cells = [];
  for (let i = 0; i < n; i += 1) for (let j = 0; j < n; j += 1) cells.push([step * (i + 1), step * (j + 1), i, j]);
  return cells;
};

function Layer({ layer: l, c1, c2 }) {
  switch (l.k) {
    case 'lines':
      return (
        <g transform={`rotate(${l.a} 50 50)`}>
          {Array.from({ length: l.n }, (_, i) => {
            const y = 50 + (i - (l.n - 1) / 2) * l.gap;
            return <line key={i} x1="-10" x2="110" y1={y} y2={y} stroke={i % 2 ? c2 : c1} strokeWidth={i % 2 ? 1.5 : 2.4} strokeDasharray={l.dash} strokeLinecap="round" opacity="0.8" />;
          })}
        </g>
      );
    case 'dots':
      return (
        <g>
          {grid(l.n).map(([x, y, i, j]) => (
            <circle key={`${i}-${j}`} cx={x + (l.off && j % 2 ? 100 / (l.n + 1) / 2 : 0)} cy={y} r={l.r} fill={(i + j) % 2 ? c2 : c1} opacity="0.85" />
          ))}
        </g>
      );
    case 'ring':
      return (
        <g>
          {Array.from({ length: l.n + 1 }, (_, i) => (
            <circle key={i} cx="50" cy="50" r={30 + i * 13} fill="none" stroke={i % 2 ? c2 : c1} strokeWidth="2" strokeDasharray={l.dash} opacity="0.75" />
          ))}
        </g>
      );
    case 'poly':
      return (
        <g>
          {Array.from({ length: l.n }, (_, i) => (
            <polygon key={i} points={polyPoints(l.s, 34 + i * 15, l.rot || 0)} fill="none" stroke={i % 2 ? c2 : c1} strokeWidth="2.2" opacity="0.8" />
          ))}
        </g>
      );
    case 'rays':
      return (
        <g>
          {Array.from({ length: l.n }, (_, i) => {
            const a = ((360 / l.n) * i - 90) * (Math.PI / 180);
            return (
              <line
                key={i}
                x1={50 + l.inner * Math.cos(a)}
                y1={50 + l.inner * Math.sin(a)}
                x2={50 + 52 * Math.cos(a)}
                y2={50 + 52 * Math.sin(a)}
                stroke={i % 2 ? c2 : c1}
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.7"
              />
            );
          })}
        </g>
      );
    case 'chev':
      return (
        <g>
          {Array.from({ length: l.n }, (_, i) => {
            const y = 30 + i * 14;
            return <path key={i} d={`M${50 - l.w} ${y + 10} L50 ${y} L${50 + l.w} ${y + 10}`} fill="none" stroke={i % 2 ? c2 : c1} strokeWidth="2.6" strokeLinecap="round" opacity="0.8" />;
          })}
        </g>
      );
    case 'dia':
      return (
        <g>
          {grid(l.n).map(([x, y, i, j]) => (
            <rect key={`${i}-${j}`} x={x - l.r} y={y - l.r} width={l.r * 2} height={l.r * 2} transform={`rotate(45 ${x} ${y})`} fill="none" stroke={(i + j) % 2 ? c2 : c1} strokeWidth="1.8" opacity="0.8" />
          ))}
        </g>
      );
    case 'lat':
      return (
        <g>
          {[45, -45].map((a) => (
            <g key={a} transform={`rotate(${a} 50 50)`}>
              {Array.from({ length: Math.round(100 / l.gap) + 3 }, (_, i) => {
                const y = i * l.gap - 20;
                return <line key={i} x1="-10" x2="110" y1={y} y2={y} stroke={a > 0 ? c1 : c2} strokeWidth="1.6" opacity="0.7" />;
              })}
            </g>
          ))}
        </g>
      );
    case 'check':
      return (
        <g>
          {grid(l.n).map(([, , i, j]) => {
            if ((i + j) % 2 !== 0) return null;
            const s = 100 / l.n;
            return <rect key={`${i}-${j}`} x={i * s} y={j * s} width={s} height={s} fill={c2} opacity="0.26" />;
          })}
        </g>
      );
    case 'scale':
      return (
        <g>
          {Array.from({ length: l.n }, (_, r) =>
            Array.from({ length: l.n * 2 - r }, (_, i) => {
              const rad = 100 / (l.n * 2 + 1);
              const x = rad * (i * 2 + (r % 2) + 1);
              const y = 24 + r * rad * 1.6;
              return <path key={`${r}-${i}`} d={`M${x - rad} ${y} A${rad} ${rad} 0 0 1 ${x + rad} ${y}`} fill="none" stroke={(i + r) % 2 ? c2 : c1} strokeWidth="1.7" opacity="0.75" />;
            }),
          )}
        </g>
      );
    case 'cross':
      return (
        <g>
          {grid(l.n).map(([x, y, i, j]) => (
            <g key={`${i}-${j}`}>
              <line x1={x - 5} x2={x + 5} y1={y} y2={y} stroke={c1} strokeWidth="2" opacity="0.8" />
              <line x1={x} x2={x} y1={y - 5} y2={y + 5} stroke={c2} strokeWidth="2" opacity="0.8" />
            </g>
          ))}
        </g>
      );
    case 'arc':
      return (
        <g>
          {Array.from({ length: l.n }, (_, i) => {
            const r = 20 + i * 15;
            return <path key={i} d={`M${50 - r} 64 A${r} ${r} 0 0 1 ${50 + r} 64`} fill="none" stroke={i % 2 ? c2 : c1} strokeWidth="2.2" opacity="0.8" />;
          })}
        </g>
      );
    default:
      return null;
  }
}

export default function SeatPatternFace({ index = 0 }) {
  const spec = SPECS[Math.abs(index) % SPECS.length];
  const [c1, c2] = TONES[Math.abs(index) % TONES.length];
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full">
      {spec.map((layer, i) => (
        <Layer key={`${layer.k}-${i}`} layer={layer} c1={c1} c2={c2} />
      ))}
    </svg>
  );
}