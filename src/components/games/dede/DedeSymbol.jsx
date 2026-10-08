import React from 'react';
import { Image } from '@/components/ui/image';
import useCutoutImage from '@/lib/cutoutImage';
import { DEDE_ART_SIZE } from './dedeAssets';
import { DEDE_SYMBOLS } from './dedeConfig';

/** Tek kart: nesnenin siyah zemini tarayıcıda kesilir, kartın ortasına oturur. */
export default function DedeSymbol({ id, win, explode }) {
  const symbol = DEDE_SYMBOLS[id];
  const art = useCutoutImage(symbol?.art || '');
  if (!symbol) return null;
  return (
    <span
      className={`dede-badge ${symbol.scatter ? 'dede-badge-dede' : ''} ${win ? 'dede-badge-win' : ''} ${
        explode ? 'dede-badge-explode' : ''
      }`}
    >
      <Image
        src={art || symbol.art}
        alt={symbol.name}
        className="dede-art"
        fittingType="fit"
        blurPlaceholder={false}
        originWidth={DEDE_ART_SIZE}
        originHeight={DEDE_ART_SIZE}
        quality={88}
      />
      {/* Bonus kartı referanstaki gibi SCATTER yazar. */}
      {symbol.scatter && <span className="dede-scatter-label">SCATTER</span>}
    </span>
  );
}