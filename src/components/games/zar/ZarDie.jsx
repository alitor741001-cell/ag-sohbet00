import React from 'react';
import { pipLayout } from './zarConfig';

/** Zar yüzü: beyaz gövde üzerinde siyah noktalar. */
export default function ZarDie({ value, size = 'md', rattle = false, dim = false }) {
  const pips = pipLayout(value);
  return (
    <span
      className={`zar-die zar-die-${size}${rattle ? ' zar-die-rattle' : ''}${dim ? ' zar-die-dim' : ''}`}
      aria-label={`${value} zar`}
    >
      {pips.map((open, index) => (
        <span key={index} className={`zar-pip${open ? '' : ' zar-pip-off'}`} />
      ))}
    </span>
  );
}