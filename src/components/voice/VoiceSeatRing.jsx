import React, { useId } from 'react';
import SeatRingOrnament from '@/components/voice/SeatRingOrnament';
import { RING_DESIGNS, gearPath, polar, polygonPath, ringPoints } from '@/components/voice/seatRingDesigns';

/**
 * Koltuk çemberi — her koltuğa kendi mücevher çerçevesi.
 * Gövde silueti (yuvarlak, sekizgen, on iki kenar, altıgen, tırtık, dişli) ve
 * taş kesimi koltuğa göre değişir. Halka, profil dairesinin tam ortasına kilitlenir.
 */

const LEAF_ANGLES = Array.from({ length: 14 }, (_, i) => (360 / 14) * i + 360 / 28);
const GEMS = [0, 90, 180, 270];
const PEARLS = ringPoints(20, 83.2);
const [HX1, HY1] = polar(88.4, -54);
const [HX2, HY2] = polar(88.4, 50);

/** Tasarımın siluetini verilen yarıçapta yol olarak üretir. */
const shapePath = (shape, r) => {
  switch (shape) {
    case 'octa': return polygonPath(8, r, 22.5);
    case 'dodeca': return polygonPath(12, r, 15);
    case 'hex': return polygonPath(6, r, 30);
    case 'scallop': return gearPath(26, r, r * 0.955, 7);
    case 'gear': return gearPath(18, r, r * 0.9, 5);
    default: return polygonPath(72, r);
  }
};

export default function VoiceSeatRing({ children, className = '', glow, variant = 0 }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const goldId = `g${uid}`;
  const goldSoftId = `gs${uid}`;
  const gemId = `m${uid}`;

  const design = RING_DESIGNS[Math.abs(variant) % RING_DESIGNS.length];
  const [g0, g1, g2, g3] = design.gold;
  const [m0, m1, m2, m3] = design.gem;
  const notched = ['circle', 'octa', 'dodeca', 'hex'].includes(design.shape);

  return (
    <span
      className={`relative block shrink-0 rounded-full ${className}`}
      style={{
        boxShadow: glow || `0 4px 12px -5px rgba(0,0,0,0.9), 0 0 15px -4px ${m1}`,
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        className="pointer-events-none absolute select-none"
        style={{
          left: '50%',
          top: '50%',
          width: '125%',
          height: '125%',
          transform: 'translate(-50%, -50%)',
          overflow: 'visible',
        }}
      >
        <defs>
          <linearGradient id={goldId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={g0} />
            <stop offset="28%" stopColor={g1} />
            <stop offset="62%" stopColor={g2} />
            <stop offset="100%" stopColor={g3} />
          </linearGradient>
          <linearGradient id={goldSoftId} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor={g1} stopOpacity="0.95" />
            <stop offset="50%" stopColor={g2} stopOpacity="0.8" />
            <stop offset="100%" stopColor={g0} stopOpacity="0.95" />
          </linearGradient>
          <radialGradient id={gemId} cx="35%" cy="28%" r="78%">
            <stop offset="0%" stopColor={m0} />
            <stop offset="32%" stopColor={m1} />
            <stop offset="70%" stopColor={m2} />
            <stop offset="100%" stopColor={m3} />
          </radialGradient>
        </defs>

        {/* mine bant gövdesi — siluet koltuğa göre değişir */}
        <path d={shapePath(design.shape, 89.4)} fill="none" stroke="#08131f" strokeWidth="19" strokeLinejoin="round" />
        <path d={shapePath(design.shape, 89.4)} fill="none" stroke={m3} strokeWidth="15" strokeLinejoin="round" opacity="0.85" />
        <path d={shapePath(design.shape, 89.4)} fill="none" stroke={`url(#${goldSoftId})`} strokeWidth="1" strokeLinejoin="round" opacity="0.55" />

        {/* filigran yapraklar */}
        {design.leaves &&
          LEAF_ANGLES.map((deg) => (
            <path
              key={`leaf-${deg}`}
              d="M0 -7 C4 -3.8 4 3.8 0 7 C-4 3.8 -4 -3.8 0 -7 Z"
              transform={`translate(${polar(86, deg).join(' ')}) rotate(${deg})`}
              fill={m3}
              stroke={`url(#${goldSoftId})`}
              strokeWidth="1.1"
              opacity="0.95"
            />
          ))}

        {/* iç inci dizisi */}
        {PEARLS.map(({ deg, x, y }) => (
          <circle key={`pearl-${deg}`} cx={x} cy={y} r="1.1" fill={g1} opacity="0.75" />
        ))}

        {/* süsele özel taş dizisi */}
        <SeatRingOrnament ornament={design.ornament} stone={design.stone} goldId={goldId} gemId={gemId} />

        {/* dört büyük fasetli taş */}
        {GEMS.map((deg) => {
          const [x, y] = polar(90.2, deg);
          return (
            <g key={`gem-${deg}`} transform={`translate(${x} ${y}) rotate(${deg})`}>
              <path d="M0 -7.4 L4.2 0 L0 7.4 L-4.2 0 Z" fill={`url(#${goldId})`} />
              <path d="M0 -5.6 L2.8 0 L0 5.6 L-2.8 0 Z" fill={`url(#${gemId})`} />
              <path d="M0 -5.6 L0 5.6 M-2.8 0 L2.8 0" stroke="rgba(255,255,255,0.5)" strokeWidth="0.45" />
            </g>
          );
        })}

        {/* üst kenarda cam parıltısı */}
        <path d={`M${HX1} ${HY1} A88.4 88.4 0 0 1 ${HX2} ${HY2}`} stroke="#ffffff" strokeOpacity="0.22" strokeWidth="3" strokeLinecap="round" fill="none" opacity={notched ? 1 : 0} />

        {/* çerçeve: dış kuşak */}
        <path
          d={shapePath(design.shape, 98.4)}
          fill="none"
          stroke={`url(#${goldId})`}
          strokeWidth="2.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={notched ? '7 3.6' : undefined}
        />
        <path d={shapePath(design.shape, 96.4)} fill="none" stroke={g1} strokeWidth="0.8" strokeLinejoin="round" opacity="0.5" />

        {/* iç taç çizgisi */}
        <path d={shapePath(design.shape, 80.6)} fill="none" stroke={`url(#${goldId})`} strokeWidth="3.2" strokeLinejoin="round" />
        <path d={shapePath(design.shape, 78.8)} fill="none" stroke="rgba(4,10,20,0.7)" strokeWidth="1.4" strokeLinejoin="round" />
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