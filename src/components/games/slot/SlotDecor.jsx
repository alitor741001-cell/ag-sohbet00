import React from 'react';
import { Image } from '@/components/ui/image';
import { SLOT_DECOR } from '../slotAssets';

export default function SlotDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-40">
      <div className="absolute -left-6 -top-4 h-24 w-24 mix-blend-screen">
        <Image src={SLOT_DECOR.reel} alt="" className="h-full w-full" fittingType="contain" />
      </div>
      <div className="absolute -right-5 top-24 h-24 w-24 mix-blend-screen">
        <Image src={SLOT_DECOR.popcorn} alt="" className="h-full w-full" fittingType="contain" />
      </div>
      <div className="absolute -left-5 bottom-6 h-24 w-24 mix-blend-screen">
        <Image src={SLOT_DECOR.chair} alt="" className="h-full w-full" fittingType="contain" />
      </div>
      <div className="absolute -right-6 bottom-2 h-24 w-24 mix-blend-screen">
        <Image src={SLOT_DECOR.seat} alt="" className="h-full w-full" fittingType="contain" />
      </div>
    </div>
  );
}