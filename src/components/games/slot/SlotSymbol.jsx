import React from 'react';
import { Image } from '@/components/ui/image';
import useSlotEdgeCleanup from '@/components/games/slot/useSlotEdgeCleanup';
import { SLOT_SYMBOL_ART, SLOT_SYMBOL_ART_SIZE } from '@/components/games/slotAssets';

/**
 * Makara sembolü: kart görseli hücresine ortalanır, çevresinde makara yatağı kalır.
 * Kartlar Şekerli Meyve kartlarıyla aynı dilde: parlak zemin, altın çift çerçeve.
 */
export default function SlotSymbol({ symbol, top, height }) {
  const art = useSlotEdgeCleanup(SLOT_SYMBOL_ART[symbol] || SLOT_SYMBOL_ART.ten);
  return (
    <span className="absolute left-0 flex w-full items-center justify-center p-[5%]" style={{ top, height }}>
      <Image
        src={art}
        alt=""
        className="slot-symbol-card w-full"
        fittingType="fit"
        blurPlaceholder={false}
        originWidth={SLOT_SYMBOL_ART_SIZE}
        originHeight={SLOT_SYMBOL_ART_SIZE}
        quality={88}
      />
    </span>
  );
}