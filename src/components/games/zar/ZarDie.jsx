import React from 'react';
import { pipLayout } from './zarConfig';
import ZarCrest from './ZarCrest';

/** Takım zarı: gövde kulüp renginde, üst yüzde arma, ön yüzde değeri gösteren noktalar. */
export default function ZarDie({ value, team = 'bjk', size = 'md', spin = false, dim = false }) {
  const pips = pipLayout(value);
  return (
    <span
      className={`zar-die zar-die-${size} zar-die-${team}${spin ? ' zar-die-spin' : ''}${dim ? ' zar-die-dim' : ''}`}
      aria-label={`${value} zar`}
    >
      <span className="zar-die-band" aria-hidden="true">
        <ZarCrest team={team} />
      </span>
      <span className="zar-die-face">
        {pips.map((open, index) => (
          <span key={index} className={`zar-pip${open ? '' : ' zar-pip-off'}`} />
        ))}
      </span>
    </span>
  );
}