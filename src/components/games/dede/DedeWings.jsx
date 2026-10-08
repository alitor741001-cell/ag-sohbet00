import React from 'react';

/** Çarpan küresinin altın kanatları: madalyonun iki yanına açılan tüyler. */
export default function DedeWings() {
  return (
    <svg viewBox="0 0 60 26" className="dede-wings" aria-hidden="true">
      <defs>
        <linearGradient id="dede-wing-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff7d6" />
          <stop offset="48%" stopColor="#ffd35c" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
      </defs>
      <g fill="url(#dede-wing-gold)">
        <ellipse cx="21" cy="11" rx="10" ry="3.8" transform="rotate(-18 21 11)" />
        <ellipse cx="14" cy="16" rx="9" ry="3.2" transform="rotate(-6 14 16)" />
        <ellipse cx="9" cy="20" rx="7" ry="2.6" transform="rotate(4 9 20)" />
        <ellipse cx="39" cy="11" rx="10" ry="3.8" transform="rotate(18 39 11)" />
        <ellipse cx="46" cy="16" rx="9" ry="3.2" transform="rotate(6 46 16)" />
        <ellipse cx="51" cy="20" rx="7" ry="2.6" transform="rotate(-4 51 20)" />
      </g>
    </svg>
  );
}