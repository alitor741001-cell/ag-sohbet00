import React from 'react';
import { Image } from '@/components/ui/image';
import { SLOT_SYMBOL_ART, SLOT_SYMBOL_ART_SIZE } from '@/components/games/slotAssets';

/** Küçük sembol ikonu: kazanan sembol listelerinde kart görseli kullanılır. */
export default function SlotSymbolIcon({ symbol, size = 18 }) {
  const art = SLOT_SYMBOL_ART[symbol] || SLOT_SYMBOL_ART.ten;
  return (
    <Image
      src={art}
      alt=""
      aria-hidden="true"
      className="inline-block shrink-0"
      style={{ width: size, height: size }}
      fittingType="fit"
      originWidth={SLOT_SYMBOL_ART_SIZE}
      originHeight={SLOT_SYMBOL_ART_SIZE}
      quality={80}
    />
  );
}