import React from 'react';
import { Image } from '@/components/ui/image';
import { ANKA_SYMBOLS, SYMBOL_IDS, SYMBOL_NAMES } from '@/components/games/anka/ankaConfig';
export default function AnkaSymbol({ symbol }) {
  const index = Math.max(0, SYMBOL_IDS.indexOf(symbol));
  return <span className="anka-symbol" role="img" aria-label={SYMBOL_NAMES[symbol]}>
    <Image src={ANKA_SYMBOLS} alt="" fittingType="fit" blurPlaceholder={false} className="anka-symbol-sheet"
      style={{ width: '300%', height: '200%', left: `${-(index % 3) * 100}%`, top: `${-Math.floor(index / 3) * 100}%` }} />
  </span>;
}