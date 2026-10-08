import React from 'react';
import { Image } from '@/components/ui/image';
import { SEKERLI_ART, SEKERLI_ART_SIZE } from './sekerliAssets';
import { SYMBOLS } from './sekerliConfig';
import useSymbolTile from '@/lib/symbolTile';

/** Kart zemini temizlenmiş şeker nesnesi. */
export default function SekerliSymbol({ id, win, boom, fall, index = 0 }) {
  const symbol = SYMBOLS[id];
  const art = SEKERLI_ART[id];
  const tile = useSymbolTile(art);
  if (!symbol || !art) return null;

  const classes = [
    'sl-sym',
    symbol.wild ? 'sl-sym-wild' : '',
    symbol.scatter ? 'sl-sym-scatter' : '',
    win ? 'sl-sym-win' : '',
    boom ? 'sl-sym-boom' : '',
    fall ? 'sl-sym-fall' : '',
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} style={{ '--sl-row': index }}>
      <Image
        src={tile}
        alt={symbol.name}
        className="sl-art"
        fittingType="fit"
        blurPlaceholder={false}
        originWidth={SEKERLI_ART_SIZE}
        originHeight={SEKERLI_ART_SIZE}
        quality={88}
      />
    </span>
  );
}