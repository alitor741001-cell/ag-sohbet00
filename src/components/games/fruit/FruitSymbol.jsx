import React from 'react';
import FruitArt from './FruitArt';
import { FRUIT_SYMBOLS } from './fruitConfig';

/** Tek sembol: nesne kendi karesine oturur, arkasında kart ya da kutu yoktur. */
export default function FruitSymbol({ id, win, scatter, explode }) {
  const symbol = FRUIT_SYMBOLS[id];
  if (!symbol) return null;
  return (
    <span
      className={`fruit-tile ${scatter ? 'fruit-tile-scatter' : ''} ${win ? 'fruit-cell-win' : ''} ${
        explode ? 'fruit-tile-explode' : ''
      }`}
    >
      <FruitArt src={symbol.art} alt={symbol.name} className="fruit-art" />
    </span>
  );
}