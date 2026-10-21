import { ringPoints } from '@/components/voice/seatRingDesigns';

const STAR = 'M0 -5 C0.6 -1.4 1.4 -0.6 5 0 C1.4 0.6 0.6 1.4 0 5 C-0.6 1.4 -1.4 0.6 -5 0 C-1.4 -0.6 -0.6 -1.4 0 -5 Z';

/** Boncuk + taş dizisi: dönüşümlü altın küre ve yuvarlak taş. */
function Beads({ goldId, gemId }) {
  return ringPoints(28, 94.6).map(({ deg, x, y }, i) =>
    i % 2 === 0 ? (
      <g key={`b${deg}`}>
        <circle cx={x} cy={y} r="3.5" fill={`url(#${goldId})`} />
        <circle cx={x - 0.9} cy={y - 0.9} r="1.1" fill="#fffdf2" opacity="0.85" />
      </g>
    ) : (
      <g key={`b${deg}`}>
        <circle cx={x} cy={y} r="3.1" fill={`url(#${goldId})`} />
        <circle cx={x} cy={y} r="2.2" fill={`url(#${gemId})`} />
        <circle cx={x - 0.6} cy={y - 0.7} r="0.65" fill="#ffffff" opacity="0.9" />
      </g>
    ),
  );
}

/** Çerçeve dizisi: altın plakalar üzerinde kare kesim taşlar. */
function Studs({ goldId, gemId }) {
  return ringPoints(16, 94.4).map(({ deg, x, y }) => (
    <g key={`s${deg}`} transform={`translate(${x} ${y}) rotate(${deg + 45})`}>
      <rect x="-4" y="-4" width="8" height="8" rx="1.4" fill={`url(#${goldId})`} />
      <rect x="-2.4" y="-2.4" width="4.8" height="4.8" rx="0.8" fill={`url(#${gemId})`} />
      <rect x="-1.6" y="-1.6" width="1.6" height="1.6" rx="0.4" fill="#ffffff" opacity="0.55" />
    </g>
  ));
}

/** Burgu halat: ters yönde akan iki kesikli şerit ve iri taşlar. */
function Rope({ goldId, gemId }) {
  return (
    <>
      <circle
        cx="100"
        cy="100"
        r="93.4"
        fill="none"
        stroke={`url(#${goldId})`}
        strokeWidth="2.6"
        strokeDasharray="7 7"
        strokeLinecap="round"
      />
      <circle
        cx="100"
        cy="100"
        r="89.2"
        fill="none"
        stroke={`url(#${gemId})`}
        strokeWidth="2.6"
        strokeDasharray="7 7"
        strokeDashoffset="7"
        strokeLinecap="round"
      />
      {ringPoints(8, 96.4).map(({ deg, x, y }) => (
        <g key={`r${deg}`}>
          <circle cx={x} cy={y} r="3" fill={`url(#${goldId})`} />
          <circle cx={x} cy={y} r="1.9" fill={`url(#${gemId})`} />
        </g>
      ))}
    </>
  );
}

/** Yıldız dizisi: taş ile altın yıldız dönüşümlü. */
function Stars({ goldId, gemId }) {
  return ringPoints(14, 94.4).map(({ deg, x, y }, i) => (
    <g key={`t${deg}`} transform={`translate(${x} ${y})`}>
      <circle cx="0" cy="0" r="3.6" fill={`url(#${goldId})`} opacity={i % 2 === 0 ? '1' : '0.35'} />
      <path d={STAR} fill={i % 2 === 0 ? `url(#${gemId})` : `url(#${goldId})`} />
    </g>
  ));
}

const ORNAMENTS = { beads: Beads, studs: Studs, rope: Rope, stars: Stars };

/** Tasarıma göre halka süslemesini çizer. */
export default function SeatRingOrnament({ ornament, goldId, gemId }) {
  const Ornament = ORNAMENTS[ornament] || Beads;
  return <Ornament goldId={goldId} gemId={gemId} />;
}