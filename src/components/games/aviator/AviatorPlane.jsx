import React from 'react';

/** Arka plansız (şeffaf) vektör uçak; rengi `color` ile verilir. */
export default function AviatorPlane({ color = '#ff2a3d', className = '', style }) {
  return (
    <svg viewBox="0 0 120 80" className={className} style={{ ...style, filter: `drop-shadow(0 0 8px ${color})` }}>
      <path d="M8 44 L28 40 L92 38 Q112 38 114 44 Q112 50 92 50 L28 48 Z" fill={color} />
      <path d="M50 40 L66 10 L76 10 L70 40 Z" fill={color} />
      <path d="M52 48 L70 74 L80 74 L72 48 Z" fill={color} opacity="0.85" />
      <path d="M10 42 L4 26 L14 26 L24 41 Z" fill={color} />
      <circle cx="102" cy="43" r="3" fill="#fff" opacity="0.8" />
      <rect x="114" y="30" width="3" height="28" rx="1.5" fill="#fff" opacity="0.7" />
    </svg>
  );
}