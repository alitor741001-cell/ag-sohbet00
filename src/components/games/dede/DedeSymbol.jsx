import React from 'react';
import { Image } from '@/components/ui/image';
import { DEDE_ART_SIZE } from './dedeAssets';
import { DEDE_SYMBOLS } from './dedeConfig';

/** Tek kart: orijinal altın madalyon görseli kartın tamamını kaplar, dışına taşmaz. */
export default function DedeSymbol({ id, win, explode }) {
  const symbol = DEDE_SYMBOLS[id];
  if (!symbol) return null;
  return (
    <span
      className={`dede-badge ${symbol.scatter ? 'dede-badge-dede' : ''} ${win ? 'dede-badge-win' : ''} ${
        explode ? 'dede-badge-explode' : ''
      }`}
    >
      <Image
        src={symbol.art}
        alt={symbol.name}
        className="dede-art"
        fittingType="fit"
        originWidth={DEDE_ART_SIZE}
        originHeight={DEDE_ART_SIZE}
        quality={88}
      />
    </span>
  );
}