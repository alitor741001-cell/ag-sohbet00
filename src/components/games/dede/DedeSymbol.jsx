import React from 'react';
import { Image } from '@/components/ui/image';

import { DEDE_SYMBOLS } from './dedeConfig';

/** Referanstan çıkarılmış gerçek alfa kanallı PNG, kırpılmadan hücreye sığar. */
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
        blurPlaceholder={false}
        quality={88}
      />
      {/* SCATTER başlığı doğrudan yeni şeffaf PNG'nin içindedir. */}
    </span>
  );
}