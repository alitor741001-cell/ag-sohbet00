import React from 'react';
import { shortCoins } from './rouletteConfig';

// Jeton rengi tutara göre: 500 yeşil, 1K mavi, 10K pembe, 100K siyah.
const tone = (v) => (v >= 100000 ? 'black' : v >= 10000 ? 'pink' : v >= 1000 ? 'blue' : 'green');

/** Kedi başı biçimli jeton (görseldeki gibi kulaklı, dişli kenarlı). */
export default function RouletteChip({ value, small = false }) {
  return (
    <span className={`rl2-chip rl2-chip-${tone(value)} ${small ? 'rl2-chip-sm' : ''}`}>
      <span className="rl2-chip-face">{shortCoins(value)}</span>
    </span>
  );
}