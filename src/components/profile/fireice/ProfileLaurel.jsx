const LEAVES = [
  { x: 22, y: 96, r: -42 },
  { x: 16, y: 82, r: -30 },
  { x: 14, y: 68, r: -18 },
  { x: 16, y: 54, r: -8 },
  { x: 22, y: 42, r: 2 },
  { x: 32, y: 30, r: 14 },
  { x: 44, y: 20, r: 26 },
];

/** Avatarın arkasındaki altın defne çelengi (iki simetrik dal). */
export default function ProfileLaurel({ className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="fi-laurel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe9a8" />
          <stop offset="55%" stopColor="#e0b23c" />
          <stop offset="100%" stopColor="#8a5a12" />
        </linearGradient>
      </defs>
      {[0, 1].map((side) => (
        <g key={side} transform={side ? 'translate(120 0) scale(-1 1)' : undefined}>
          <path
            d="M24 104C8 82 8 54 22 30"
            fill="none"
            stroke="url(#fi-laurel)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {LEAVES.map((leaf) => (
            <ellipse
              key={`${side}-${leaf.y}`}
              rx="4"
              ry="8.5"
              fill="url(#fi-laurel)"
              transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.r})`}
              opacity="0.95"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}