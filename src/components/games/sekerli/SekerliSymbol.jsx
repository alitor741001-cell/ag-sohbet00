import React from 'react';
import SekerliArt from './SekerliArt';
import { SEKERLI_ART } from './sekerliAssets';
import { SYMBOLS } from './sekerliConfig';

/** Tek sembol: nesne kendi karesine oturur, arkasında kart ya da kutu yoktur. */
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
      <SekerliArt src={art} alt={symbol.name} className="sl-art" />
    </span>
  );
}