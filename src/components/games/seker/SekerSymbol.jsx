import React from 'react';
import { SEKER_SHAPES } from './sekerShapes';
import { SEKER_SYMBOLS } from './sekerConfig';

/** Tek şeker: parlak plastik görünümlü gövde, sol üstte beyaz parlama, yumuşak gölge. */
export default function SekerSymbol({ id, win, scatter }) {
  const symbol = SEKER_SYMBOLS[id];
  const Shape = symbol ? SEKER_SHAPES[symbol.shape] : null;
  if (!symbol || !Shape) return null;
  const gradientId = `seker-gloss-${id}`;

  return (
    <span className={`seker-tile ${scatter ? 'seker-tile-scatter' : ''} ${win ? 'seker-cell-win' : ''}`}>
      <svg viewBox="0 0 40 40" className="seker-art" aria-hidden="true">
        <defs>
          <radialGradient id={gradientId} cx="36%" cy="28%" r="76%">
            <stop offset="0%" stopColor={symbol.light} />
            <stop offset="52%" stopColor={symbol.color} />
            <stop offset="100%" stopColor={symbol.dark} />
          </radialGradient>
        </defs>
        <Shape fill={`url(#${gradientId})`} light={symbol.light} dark={symbol.dark} />
      </svg>
      <span className="sr-only">{symbol.name}</span>
    </span>
  );
}