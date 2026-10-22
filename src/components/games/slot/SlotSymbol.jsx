import React from 'react';
import useSlotEdgeCleanup from '@/components/games/slot/useSlotEdgeCleanup';
import { SLOT_SYMBOL_ART } from '@/components/games/slotAssets';

/**
 * Makara sembolü: kart görseli hücresine ortalanır, çevresinde makara yatağı kalır.
 * Kartlar Şekerli Meyve kartlarıyla aynı dilde: parlak zemin, altın çift çerçeve.
 */
// Hayvanlar ve jackpot hafifçe büyütülür.
const SYMBOL_SCALE = { tiger: 1.15, eagle: 1.15, lion: 1.15, jackpot: 1.12 };

export default function SlotSymbol({ symbol, top, height }) {
  const art = useSlotEdgeCleanup(SLOT_SYMBOL_ART[symbol] || SLOT_SYMBOL_ART.ten);
  return (
    <span className="absolute left-0 flex w-full items-center justify-center p-[5%]" style={{ top, height }}>
      {/* Dönerken anında görünmesi için temizlenmiş görsel doğrudan, beklemeden çizilir. */}
      <img
        src={art}
        alt=""
        loading="eager"
        decoding="sync"
        draggable={false}
        style={{ transform: `scale(${SYMBOL_SCALE[symbol] || 1})` }}
        className="slot-symbol-card aspect-square h-full max-w-full rounded-lg object-cover"
      />
    </span>
  );
}