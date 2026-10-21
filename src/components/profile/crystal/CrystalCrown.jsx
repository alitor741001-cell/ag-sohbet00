import { useId } from 'react';

/** Referanstaki altın taç motifi: kristal kartın başlığında ve kanat diplerinde kullanılır. */
export default function CrystalCrown({ size = 26, className = '', style }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <svg
      viewBox="0 0 44 32"
      aria-hidden
      className={className}
      style={{ width: size, height: size * 0.73, filter: 'drop-shadow(0 0 6px rgba(244,213,138,0.7))', ...style }}
    >
      <defs>
        <linearGradient id={`crown-g-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffbe6" />
          <stop offset="34%" stopColor="#f3d98c" />
          <stop offset="70%" stopColor="#c9a13b" />
          <stop offset="100%" stopColor="#8a6a24" />
        </linearGradient>
      </defs>
      <path
        d="M2 28 L5 9 L14 18 L22 3 L30 18 L39 9 L42 28 Z"
        fill={`url(#crown-g-${uid})`}
        stroke="#fff6d6"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path d="M4.5 24.5 H39.5" stroke="#fff6d6" strokeOpacity="0.6" strokeWidth="1" />
      <circle cx="5" cy="8.5" r="2.2" fill="#fffdf0" />
      <circle cx="22" cy="3" r="2.6" fill="#fffdf0" />
      <circle cx="39" cy="8.5" r="2.2" fill="#fffdf0" />
      <circle cx="22" cy="17" r="1.7" fill="#fffdf0" opacity="0.85" />
    </svg>
  );
}