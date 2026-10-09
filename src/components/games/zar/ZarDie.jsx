import React from 'react';
import { pipLayout } from './zarConfig';

/** Zar: gövde takım renginde (tone verilirse o renkte), yüzünde değeri gösteren parlak noktalar. */
export default function ZarDie({ value, team = 'bjk', size = 'md', tone }) {
  const pips = pipLayout(value);
  return (
    <span className={`zar-die zar-die-${size} zar-die-${tone || team}`} aria-label={`${value} zar`}>
      {pips.map((open, index) => (
        <span key={index} className={`zar-pip${open ? '' : ' zar-pip-off'}`} />
      ))}
    </span>
  );
}