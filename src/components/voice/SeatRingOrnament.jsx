import { ringPoints } from '@/components/voice/seatRingDesigns';

const STAR = 'M0 -5 C0.6 -1.4 1.4 -0.6 5 0 C1.4 0.6 0.6 1.4 0 5 C-0.6 1.4 -1.4 0.6 -5 0 C-1.4 -0.6 -0.6 -1.4 0 -5 Z';

/** Kesime göre taş: yuvarlak, kare, markiz ve yıldız. */
function Stone({ x, y, deg, size, cut, goldId, gemId }) {
  const plate = `url(#${goldId})`;
  const gem = `url(#${gemId})`;
  if (cut === 'square') {
    return (
      <g transform={`translate(${x} ${y}) rotate(${deg + 45})`}>
        <rect x={-size * 1.05} y={-size * 1.05} width={size * 2.1} height={size * 2.1} rx="0.9" fill={plate} />
        <rect x={-size * 0.72} y={-size * 0.72} width={size * 1.44} height={size * 1.44} rx="0.5" fill={gem} />
        <rect x={-size * 0.4} y={-size * 0.4} width={size * 0.8} height={size * 0.8} rx="0.4" fill="#ffffff" opacity="0.5" />
      </g>
    );
  }
  if (cut === 'marquise') {
    return (
      <g transform={`translate(${x} ${y}) rotate(${deg})`}>
        <ellipse rx={size * 1.15} ry={size * 1.7} fill={plate} />
        <ellipse rx={size * 0.8} ry={size * 1.3} fill={gem} />
        <ellipse cx={-size * 0.22} cy={-size * 0.4} rx={size * 0.26} ry={size * 0.5} fill="#ffffff" opacity="0.65" />
      </g>
    );
  }
  if (cut === 'star') {
    return (
      <g transform={`translate(${x} ${y}) rotate(${deg}) scale(${size / 4})`}>
        <circle r="4.4" fill={plate} />
        <path d={STAR} fill={gem} />
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={size * 1.35} fill={plate} />
      <circle r={size} fill={gem} />
      <circle cx={-size * 0.3} cy={-size * 0.35} r={size * 0.32} fill="#ffffff" opacity="0.85" />
    </g>
  );
}

/** Boncuk + taş dizisi. */
function Beads({ goldId, gemId, cut }) {
  return ringPoints(28, 94.6).map(({ deg, x, y }, i) =>
    i % 2 === 0 ? (
      <g key={`b${deg}`}>
        <circle cx={x} cy={y} r="3.3" fill={`url(#${goldId})`} />
        <circle cx={x - 0.9} cy={y - 0.9} r="1" fill="#fffdf2" opacity="0.85" />
      </g>
    ) : (
      <Stone key={`b${deg}`} x={x} y={y} deg={deg} size={2} cut={cut} goldId={goldId} gemId={gemId} />
    ),
  );
}

/** Plaka dizisi: altın yataklar üzerinde kesim taşlar. */
function Studs({ goldId, gemId, cut }) {
  return ringPoints(16, 94.4).map(({ deg, x, y }) => (
    <g key={`s${deg}`}>
      <circle cx={x} cy={y} r="5" fill={`url(#${goldId})`} />
      <Stone x={x} y={y} deg={deg} size={2.4} cut={cut} goldId={goldId} gemId={gemId} />
    </g>
  ));
}

/** Burgu halat: ters yönde akan iki kesikli şerit ve iri taşlar. */
function Rope({ goldId, gemId, cut }) {
  return (
    <>
      <circle cx="100" cy="100" r="93.4" fill="none" stroke={`url(#${goldId})`} strokeWidth="2.6" strokeDasharray="7 7" strokeLinecap="round" />
      <circle cx="100" cy="100" r="89.2" fill="none" stroke={`url(#${gemId})`} strokeWidth="2.6" strokeDasharray="7 7" strokeDashoffset="7" strokeLinecap="round" />
      {ringPoints(8, 96.4).map(({ deg, x, y }) => (
        <Stone key={`r${deg}`} x={x} y={y} deg={deg} size={2.4} cut={cut} goldId={goldId} gemId={gemId} />
      ))}
    </>
  );
}

/** Yıldız dizisi: iri taş ile küçük taş dönüşümlü. */
function Stars({ goldId, gemId, cut }) {
  return ringPoints(14, 94.4).map(({ deg, x, y }, i) => (
    <Stone
      key={`t${deg}`}
      x={x}
      y={y}
      deg={deg}
      size={i % 2 === 0 ? 3.1 : 1.9}
      cut={i % 2 === 0 ? cut : 'round'}
      goldId={goldId}
      gemId={gemId}
    />
  ));
}

const ORNAMENTS = { beads: Beads, studs: Studs, rope: Rope, stars: Stars };

/** Tasarıma göre halka süslemesini çizer. */
export default function SeatRingOrnament({ ornament, stone, goldId, gemId }) {
  const Ornament = ORNAMENTS[ornament] || Beads;
  return <Ornament goldId={goldId} gemId={gemId} cut={stone || 'round'} />;
}