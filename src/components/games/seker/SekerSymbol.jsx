import React from 'react';
import { Image } from '@/components/ui/image';
import useSymbolTile from '@/lib/symbolTile';
import { SEKER_ART_SIZE } from './sekerAssets';
import { SEKER_SYMBOLS } from './sekerConfig';

/** Tek şeker: gerçekçi şeker görseli, zemini silinmiş halde kendi karesine oturur. */
export default function SekerSymbol({ id, win, scatter, explode }) {
  const symbol = SEKER_SYMBOLS[id];
  const art = useSymbolTile(symbol?.art || '');
  if (!symbol) return null;

  return (
    <span
      className={`seker-tile ${scatter ? 'seker-tile-scatter' : ''} ${win ? 'seker-cell-win' : ''} ${
        explode ? 'seker-tile-explode' : ''
      }`}
    >
      <Image
        src={art}
        alt={symbol.name}
        className="seker-art"
        fittingType="fit"
        blurPlaceholder={false}
        originWidth={SEKER_ART_SIZE}
        originHeight={SEKER_ART_SIZE}
        quality={88}
      />
    </span>
  );
}