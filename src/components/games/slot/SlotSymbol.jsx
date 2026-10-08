import React from 'react';
import { Image } from '@/components/ui/image';
import useCutoutImage from '@/lib/cutoutImage';
import { SLOT_SYMBOL_ART, SLOT_SYMBOL_ART_SIZE } from '@/components/games/slotAssets';

/**
 * Makara sembolü: görselin kendi zemini kesilir ve sembol tek siyah makara
 * yatağına oturur — kartlar tek tek kesilmiş gibi görünmez.
 */
export default function SlotSymbol({ symbol, top, height }) {
  const art = SLOT_SYMBOL_ART[symbol] || SLOT_SYMBOL_ART.ten;
  // Zemin kesilene kadar görsel olduğu gibi gösterilir.
  const cut = useCutoutImage(art);
  return (
    <span className="absolute left-0 flex w-full items-center justify-center p-[5%]" style={{ top, height }}>
      <Image
        src={cut || art}
        alt=""
        className="w-full"
        fittingType="fit"
        blurPlaceholder={false}
        originWidth={SLOT_SYMBOL_ART_SIZE}
        originHeight={SLOT_SYMBOL_ART_SIZE}
        quality={88}
      />
    </span>
  );
}