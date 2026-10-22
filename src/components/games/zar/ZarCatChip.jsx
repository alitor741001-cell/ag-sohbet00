import React from 'react';
import '@/styles/roulette2.css';
import { chipTone, formatChipAmount } from './zarConfig';

/** Kedi başı jeton (rulet ile aynı biçim): 10 yeşil, 100 mavi, 1K pembe, 10K altın-siyah. */
export default function ZarCatChip({ value, small = false, style }) {
  return (
    <span style={style} className={`rl2-chip rl2-chip-${chipTone(value)} ${small ? 'zr2-chip-sm' : ''}`}>
      <span className="rl2-chip-face">{formatChipAmount(value)}</span>
    </span>
  );
}