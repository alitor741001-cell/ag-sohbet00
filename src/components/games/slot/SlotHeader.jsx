import React from 'react';
import { Image } from '@/components/ui/image';
import { SLOT_DECOR } from '../slotAssets';

export default function SlotHeader() {
  return (
    <div className="flex items-center justify-between">
      <p className="slot-logo-text font-display text-xl font-black lowercase tracking-tight">filmkeyfi</p>
      <div className="flex items-center gap-1 rounded-full border border-slot-gold/60 bg-slot-surface px-2 py-0.5">
        <div className="h-5 w-5">
          <Image src={SLOT_DECOR.popcorn} alt="" className="h-full w-full" fittingType="contain" />
        </div>
        <span className="text-[9px] font-black tracking-widest text-slot-gold">GOOD VIBES</span>
      </div>
    </div>
  );
}