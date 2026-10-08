import React from 'react';
import { Image } from '@/components/ui/image';
import { SEKERLI_ART, SEKERLI_ART_SIZE } from './sekerliAssets';
import { SYMBOLS } from './sekerliConfig';

/** Tek kart: şeker görseli kartın tamamını kaplar, kare dışına taşmaz (DEDE kartı gibi). */
export default function SekerliSymbol({ id, win, boom, fall, index = 0 }) {
  const symbol = SYMBOLS[id];
  const art = SEKERLI_ART[id];
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
        src={art}
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