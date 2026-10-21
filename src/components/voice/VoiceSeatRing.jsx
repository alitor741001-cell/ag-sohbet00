import React, { useId } from 'react';

/**
 * Koltuk çemberi — "saray mücevheri" deseni.
 * Gerçek çizimle (SVG) kurulur: koyu mine bant üzerinde dönüşümlü altın boncuk
 * ve turkuaz taş dizisi, araya işlenmiş altın filigran yaprakları, dört yönde
 * büyük fasetli turkuaz kaboşonlar ve dış taç çizgisi.
 * Çocuk içerik dairenin tam ortasına oturur; halka dışa taşarak sarmalar.
 */

const CX = 100;
const CONTENT_R = 80; // içerik yarıçapı (çocuklar bu daireyi doldurur)
const BEAD_COUNT = 28;
const LEAF_COUNT = 14;

const polar = (r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CX + r * Math.sin(rad)];
};

const BEADS = Array.from({ length: BEAD_COUNT }, (_, i) => {
  const deg = (360 / BEAD_COUNT) * i;
  const [x, y] = polar(94.6, deg);
  return { deg, x, y, gold: i % 2 === 0 };
});

const LEAVES = Array.from({ length: LEAF_COUNT }, (_, i) => {
  const deg = (360 / LEAF_COUNT) * i + 360 / (LEAF_COUNT * 2);
  return deg;
});

const GEMS = [0, 90, 180, 270];
const SPARKLES = [45, 135, 225, 315];

export default function VoiceSeatRing({ children, className = '', glow }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gold = `gold-${uid}`;
  const goldSoft = `goldSoft-${uid}`;
  const turq = `turq-${uid}`;
  const glowId = `glow-${uid}`;

  return (
    <span
      className={`relative block shrink-0 rounded-full ${className}`}
      style={{
        boxShadow: glow || '0 4px 12px -5px rgba(0,0,0,0.9), 0 0 14px -4px rgba(108,212,214,0.6)',
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        className="pointer-events-none absolute select-none"
        style={{ inset: '-12.5%', width: '125%', height: '125%' }}
      >
        <defs>
          <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8a6524" />
            <stop offset="18%" stopColor="#fff6da" />
            <stop offset="38%" stopColor="#e0b463" />
            <stop offset="55%" stopColor="#8a6524" />
            <stop offset="72%" stopColor="#ffeec4" />
            <stop offset="100%" stopColor="#a97c2e" />
          </linearGradient>
          <linearGradient id={goldSoft} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#fff3cf" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#d9ab58" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#6b4d18" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id={turq} cx="35%" cy="28%" r="78%">
            <stop offset="0%" stopColor="#eafeff" />
            <stop offset="32%" stopColor="#6cd4d6" />
            <stop offset="70%" stopColor="#1a7a83" />
            <stop offset="100%" stopColor="#0a3941" />
          </radialGradient>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4.5" />
          </filter>
        </defs>

        {/* dış ışıma */}
        <circle
          cx={CX}
          cy={CX}
          r="96"
          fill="none"
          stroke="#6cd4d6"
          strokeWidth="7"
          opacity="0.42"
          filter={`url(#${glowId})`}
        />

        {/* mine bant gövdesi */}
        <circle cx={CX} cy={CX} r="89.4" fill="none" stroke="#0a1524" strokeWidth="19" />
        <circle
          cx={CX}
          cy={CX}
          r="89.4"
          fill="none"
          stroke="rgba(14,54,64,0.95)"
          strokeWidth="16"
        />
        <circle
          cx={CX}
          cy={CX}
          r="89.4"
          fill="none"
          stroke="url(#goldSoft)"
          strokeWidth="1"
          opacity="0.5"
        />

        {/* filigran yapraklar */}
        {LEAVES.map((deg) => (
          <path
            key={`leaf-${deg}`}
            d="M0 -7 C4 -3.8 4 3.8 0 7 C-4 3.8 -4 -3.8 0 -7 Z"
            transform={`translate(${polar(86, deg).join(' ')}) rotate(${deg})`}
            fill="#0d2a33"
            stroke="url(#goldSoft)"
            strokeWidth="1.1"
            opacity="0.95"
          />
        ))}

        {/* ince gravür çizgisi */}
        <circle
          cx={CX}
          cy={CX}
          r="82.2"
          fill="none"
          stroke="rgba(255,240,200,0.22)"
          strokeWidth="0.9"
        />

        {/* altın boncuk + turkuaz taş dizisi */}
        {BEADS.map(({ deg, x, y, gold: isGold }) =>
          isGold ? (
            <g key={`bead-${deg}`}>
              <circle cx={x} cy={y} r="3.5" fill="url(#gold)" />
              <circle cx={x - 0.9} cy={y - 0.9} r="1.1" fill="#fffdf2" opacity="0.85" />
            </g>
          ) : (
            <g key={`bead-${deg}`}>
              <circle cx={x} cy={y} r="3.1" fill="url(#gold)" />
              <circle cx={x} cy={y} r="2.2" fill="url(#turq)" />
              <circle cx={x - 0.6} cy={y - 0.7} r="0.65" fill="#f4ffff" opacity="0.9" />
            </g>
          ),
        )}

        {/* dört büyük fasetli kaboşon */}
        {GEMS.map((deg) => {
          const [x, y] = polar(90.2, deg);
          return (
            <g key={`gem-${deg}`} transform={`translate(${x} ${y}) rotate(${deg})`}>
              <path d="M0 -7.4 L4.2 0 L0 7.4 L-4.2 0 Z" fill="url(#gold)" />
              <path d="M0 -5.6 L2.8 0 L0 5.6 L-2.8 0 Z" fill="url(#turq)" />
              <path
                d="M0 -5.6 L0 5.6 M-2.8 0 L2.8 0"
                stroke="rgba(255,255,255,0.55)"
                strokeWidth="0.45"
              />
            </g>
          );
        })}

        {/* dış taç çizgisi */}
        <circle cx={CX} cy={CX} r="98.6" fill="none" stroke="url(#gold)" strokeWidth="2.2" />
        <circle cx={CX} cy={CX} r="97" fill="none" stroke="rgba(255,246,222,0.3)" strokeWidth="0.8" />

        {/* iç taç çizgisi */}
        <circle cx={CX} cy={CX} r="80.6" fill="none" stroke="url(#gold)" strokeWidth="3.2" />
        <circle cx={CX} cy={CX} r="78.8" fill="none" stroke="rgba(4,10,20,0.65)" strokeWidth="1.4" />

        {/* parıltılar */}
        {SPARKLES.map((deg) => {
          const [x, y] = polar(92, deg);
          return (
            <path
              key={`spark-${deg}`}
              d="M0 -5.2 C0.6 -1.6 1.6 -0.6 5.2 0 C1.6 0.6 0.6 1.6 0 5.2 C-0.6 1.6 -1.6 0.6 -5.2 0 C-1.6 -0.6 -0.6 -1.6 0 -5.2 Z"
              transform={`translate(${x} ${y})`}
              fill="#ffffff"
              opacity="0.9"
            />
          );
        })}
      </svg>

      <span
        className="relative block h-full w-full overflow-hidden rounded-full bg-[#08101d]"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(6,12,22,0.9), inset 0 2px 7px rgba(0,0,0,0.6)' }}
      >
        {children}
      </span>
    </span>
  );
}