import React from 'react';
import { Image } from '@/components/ui/image';
import { FRUIT_ART_SIZE } from './fruitAssets';
import { FRUIT_SYMBOLS } from './fruitConfig';

/** Tek kart: gerçek meyve görseli kartın tamamını kaplar, dışına taşmaz. */
export default function FruitSymbol({ id, win, scatter }) {
  const symbol = FRUIT_SYMBOLS[id];
  if (!symbol) return null;
  return (
    <span className={`fruit-tile ${scatter ? 'fruit-tile-scatter' : ''} ${win ? 'fruit-cell-win' : ''}`}>
      <Image
        src={symbol.art}
        alt={symbol.name}
        className="fruit-art"
        fittingType="fill"
        originWidth={FRUIT_ART_SIZE}
        originHeight={FRUIT_ART_SIZE}
        quality={88}
      />
    </span>
  );
}