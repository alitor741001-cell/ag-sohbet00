import React from 'react';

// Kulüp armaları zarın üst yüzüne (açık renkli şeride) koyu renkte işlenir,
// böylece küçük boyutta da seçilir kalır.
const CRESTS = {
  bjk: { ink: '#0b0b0e', stars: 3, label: 'BJK' },
  fb: { ink: '#0a1c4d', stars: 5, label: 'FB' },
  gs: { ink: '#3c0710', stars: 5, label: 'GS' },
};

const STAR = 'M0,-2.15 L0.63,-0.66 L2.2,-0.66 L0.94,0.29 L1.42,1.85 L0,0.87 L-1.42,1.85 L-0.94,0.29 L-2.2,-0.66 L-0.63,-0.66 Z';

/** Armanın üstünde yay şeklinde dizilen kulüp yıldızları. */
function CrestStars({ count, color }) {
  const step = 5.1;
  const start = 20 - ((count - 1) * step) / 2;
  return (
    <g fill={color}>
      {Array.from({ length: count }, (_, index) => {
        const offset = count === 1 ? 0 : (index / (count - 1)) * 2 - 1;
        return (
          <path
            key={index}
            d={STAR}
            transform={`translate(${start + index * step} ${4 + Math.abs(offset) * 2.2}) scale(0.86)`}
          />
        );
      })}
    </g>
  );
}

/** Takım zarının üst yüzündeki kulüp arması. */
export default function ZarCrest({ team = 'bjk' }) {
  const crest = CRESTS[team] || CRESTS.bjk;
  const ink = crest.ink;

  return (
    <svg viewBox="0 0 40 20" aria-hidden="true" role="presentation">
      <CrestStars count={crest.stars} color={ink} />
      {team === 'bjk' ? (
        <g>
          <path
            d="M12.9 7.2 H27.1 V13.4 C27.1 16.5 24 18.7 20 19.5 C16 18.7 12.9 16.5 12.9 13.4 Z"
            fill="#ffffff"
            stroke={ink}
            strokeWidth="0.8"
          />
          <text x="20" y="13" textAnchor="middle" fontSize="5.6" fontWeight="900" fill={ink}>BJK</text>
          <rect x="17.5" y="14.3" width="5" height="2" rx="0.4" fill="#c1121f" />
        </g>
      ) : (
        <g>
          <ellipse
            cx="20"
            cy="13.4"
            rx={team === 'gs' ? 6.4 : 6}
            ry={team === 'gs' ? 5.6 : 6}
            fill="#ffffff"
            stroke={ink}
            strokeWidth="0.9"
          />
          <text x="20" y="15.5" textAnchor="middle" fontSize="5.6" fontWeight="900" fill={ink}>{crest.label}</text>
        </g>
      )}
    </svg>
  );
}