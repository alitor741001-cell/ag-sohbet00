import { useId } from 'react';
import { crystalSkin } from '@/components/profile/crystal/crystalTheme';

/** Fotoğrafın iki yanından açılan kristal kanatlar: referanstaki çok tüylü parlak kanat motifi. */
const FEATHERS = [
  { angle: -78, length: 108, width: 11, opacity: 0.9 },
  { angle: -62, length: 102, width: 10.5, opacity: 0.96 },
  { angle: -46, length: 90, width: 9.5, opacity: 1 },
  { angle: -30, length: 75, width: 8.5, opacity: 0.97 },
  { angle: -15, length: 57, width: 7, opacity: 0.92 },
];

const featherPath = (length, width) =>
  `M0 0C${-width} ${-length * 0.34} ${-width * 0.72} ${-length * 0.78} 0 ${-length}C${width * 0.72} ${-length * 0.78} ${width} ${-length * 0.34} 0 0Z`;

function Wing({ gradient, gold }) {
  return (
    <g fill={`url(#${gradient})`} stroke="rgba(244,221,164,0.55)" strokeWidth="0.8">
      {FEATHERS.map(({ angle, length, width, opacity }) => (
        <g key={angle} transform={`translate(112 102) rotate(${angle})`} opacity={opacity}>
          <path d={featherPath(length, width)} />
          <path d={`M0 -4L0 ${-length * 0.9}`} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.7" />
        </g>
      ))}
      <path d="M96 120C106 113 116 111 127 114" fill="none" stroke={gold} strokeWidth="1.5" strokeOpacity="0.8" strokeLinecap="round" />
      <circle cx="96" cy="120" r="2" fill={gold} opacity="0.85" />
    </g>
  );
}

export default function CrystalWings({ tone = 'blue' }) {
  const c = crystalSkin(tone);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradient = `wing-gradient-${uid}`;

  return (
    <svg
      aria-hidden
      viewBox="0 0 300 176"
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ width: 296, height: 174, filter: `drop-shadow(0 0 9px ${c.glow})` }}
    >
      <defs>
        <linearGradient id={gradient} x1="0.05" y1="1" x2="0.9" y2="0">
          <stop offset="0%" stopColor={c.wing[2]} />
          <stop offset="46%" stopColor={c.wing[1]} />
          <stop offset="100%" stopColor={c.wing[0]} />
        </linearGradient>
      </defs>
      <Wing gradient={gradient} gold={c.gold} />
      <g transform="translate(300,0) scale(-1,1)">
        <Wing gradient={gradient} gold={c.gold} />
      </g>
    </svg>
  );
}