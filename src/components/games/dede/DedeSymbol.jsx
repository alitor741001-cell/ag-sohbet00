import React from 'react';
import { DEDE_SYMBOLS } from './dedeConfig';

/** Tek karo: renkli madalyon zemini üzerinde sembol. */
export default function DedeSymbol({ id, win, explode }) {
  const symbol = DEDE_SYMBOLS[id];
  if (!symbol) return null;
  return (
    <span
      className={`dede-badge dede-badge-${id} ${win ? 'dede-badge-win' : ''} ${explode ? 'dede-badge-explode' : ''}`}
    >
      <span className="dede-glyph" role="img" aria-label={symbol.name}>
        {symbol.emoji}
      </span>
    </span>
  );
}