import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { LUCKY_OLYMPUS_SCREEN } from './luckyOlympusAssets';

/** Lucky Olympus oyun ekranı: tanıtım kartına dokununca panelde birebir açılır. */
export default function LuckyOlympusGame({ onBack }) {
  return (
    <div className="relative min-h-0 flex-1 bg-slot">
      <Image
        src={LUCKY_OLYMPUS_SCREEN}
        alt="Lucky Olympus oyun ekranı"
        fittingType="fit"
        quality={92}
        className="absolute inset-0 h-full w-full"
      />
      <button
        type="button"
        onClick={onBack}
        aria-label="Oyun merkezine dön"
        className="absolute left-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm active:scale-95"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  );
}