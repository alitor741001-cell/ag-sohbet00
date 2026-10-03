import React from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { SLOT_DECOR } from '../slotAssets';

export default function SlotBanner({ onExit, onBack }) {
  return (
    <div className="relative">
      <div className="slot-banner relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0">
          <Image src={SLOT_DECOR.hall} alt="" className="h-full w-full" fittingType="fill" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-slot/35 via-slot/60 to-slot/95" />
        <div className="slot-spotlight absolute -top-8 left-8 h-24 w-14" />
        <div className="slot-spotlight absolute -top-8 right-8 h-24 w-14" />

        <div className="absolute inset-x-0 top-0 h-4 opacity-90">
          <Image src={SLOT_DECOR.strip} alt="" className="h-full w-full" fittingType="fill" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-4 opacity-70">
          <Image src={SLOT_DECOR.strip} alt="" className="h-full w-full" fittingType="fill" />
        </div>

        <div className="relative flex flex-col items-center gap-0.5 px-3 pb-4 pt-5">
          <div className="h-7 w-9">
            <Image src={SLOT_DECOR.crown} alt="" className="h-full w-full" fittingType="contain" />
          </div>
          <p className="slot-logo-3d font-display text-[2rem] font-black lowercase leading-none tracking-tight">
            filmkeyfi
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-5 w-6">
              <Image src={SLOT_DECOR.reel} alt="" className="h-full w-full" fittingType="contain" />
            </div>
            <div className="h-5 w-8">
              <Image src={SLOT_DECOR.popcorn} alt="" className="h-full w-full" fittingType="contain" />
            </div>
            <div className="h-5 w-6">
              <Image src={SLOT_DECOR.seat} alt="" className="h-full w-full" fittingType="contain" />
            </div>
          </div>

          <div className="absolute right-2 top-5 flex items-center gap-1 rounded-full border border-slot-gold/60 bg-slot-surface/90 px-2 py-0.5">
            <div className="h-4 w-4">
              <Image src={SLOT_DECOR.popcorn} alt="" className="h-full w-full" fittingType="contain" />
            </div>
            <span className="text-[9px] font-black tracking-widest text-slot-gold">GOOD VIBES</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onBack}
        aria-label="Oyun listesine dön"
        className="slot-close absolute -top-1 left-0 flex h-9 w-9 items-center justify-center rounded-full"
      >
        <ChevronLeft className="h-5 w-5 text-slot-gold" />
      </button>

      <button
        type="button"
        onClick={onExit}
        aria-label="Oyunu kapat"
        className="slot-close slot-close-x absolute -top-1.5 right-0 flex h-10 w-10 items-center justify-center rounded-full"
      >
        <X className="h-6 w-6 text-white" />
      </button>
    </div>
  );
}