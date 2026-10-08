import React from 'react';
import { FRUIT_SYMBOLS } from './fruitConfig';

/** Tek karo: şeker tonlu zemin üzerinde meyve. */
export default function FruitSymbol({ id, win, scatter }) {
  const symbol = FRUIT_SYMBOLS[id];
  if (!symbol) return null;
  return (
    <span className={`fruit-tile fruit-tile-${id} ${win ? 'fruit-cell-win' : ''} ${scatter ? 'ring-2 ring-white/90' : ''}`}>
      <span className="fruit-emoji" role="img" aria-label={symbol.name}>
        {symbol.emoji}
      </span>
    </span>
  );
}