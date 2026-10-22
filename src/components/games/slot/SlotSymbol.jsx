import React from 'react';
import useSlotEdgeCleanup from '@/components/games/slot/useSlotEdgeCleanup';
import { SLOT_SYMBOL_ART } from '@/components/games/slotAssets';

/**
 * Makara sembolü: kart görseli hücresine ortalanır, çevresinde makara yatağı kalır.
 * Kartlar Şekerli Meyve kartlarıyla aynı dilde: parlak zemin, altın çift çerçeve.
 */

export default function SlotSymbol({ symbol, top, height }) {
  const art = useSlotEdgeCleanup(SLOT_SYMBOL_ART[symbol] || SLOT_SYMBOL_ART.ten);
  return (
    <span className="absolute left-0 flex w-full items-center justify-center p-[13%]" style={{ top, height }}>
      {/* Dönerken anında görünmesi için temizlenmiş görsel doğrudan, beklemeden çizilir. */}
      <img
        src={art}
        alt=""
        loading="eager"
        decoding="sync"
        draggable={false}
        className="slot-symbol-card aspect-square h-full max-w-full rounded-lg object-contain"
      />
    </span>
  );
}