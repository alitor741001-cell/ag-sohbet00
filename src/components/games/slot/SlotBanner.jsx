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
        <div className="slot-bokeh absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-slot/30 via-slot/55 to-slot/95" />

        <div className="slot-spotlight absolute -top-8 left-1/3 h-24 w-14" />
        <div className="slot-spotlight absolute -top-8 right-1/3 h-24 w-14" />

        <div className="absolute left-1.5 top-3.5 h-11 w-11">
          <Image src={SLOT_DECOR.reel} alt="" className="h-full w-full" fittingType="contain" />
        </div>
        <div className="absolute left-10 top-5 h-10 w-10">
          <Image src={SLOT_DECOR.popcorn} alt="" className="h-full w-full" fittingType="contain" />
        </div>

        <div className="absolute right-1.5 top-3.5 flex items-center gap-1 rounded-lg border-2 border-white/75 bg-slot-red px-1.5 py-0.5 shadow-[0_0_12px_rgba(220,38,38,0.85)]">
          <div className="h-4 w-4">
            <Image src={SLOT_DECOR.popcorn} alt="" className="h-full w-full" fittingType="contain" />
          </div>
          <span className="text-[9px] font-black tracking-widest text-white">GOOD VIBES</span>
        </div>

        <div className="absolute inset-x-0 top-0 h-3.5 opacity-90">
          <Image src={SLOT_DECOR.strip} alt="" className="h-full w-full" fittingType="fill" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-3.5 opacity-80">
          <Image src={SLOT_DECOR.strip} alt="" className="h-full w-full" fittingType="fill" />
        </div>

        <div className="relative flex flex-col items-center gap-1 px-3 pb-4 pt-7">
          <div className="h-7 w-9">
            <Image src={SLOT_DECOR.crown} alt="" className="h-full w-full" fittingType="contain" />
          </div>

          <div className="flex items-center gap-1">
            <div className="h-6 w-10 shrink-0">
              <Image src={SLOT_DECOR.strip} alt="" className="h-full w-full" fittingType="fill" />
            </div>
            <p className="slot-logo-3d font-display text-[1.75rem] font-black lowercase leading-none tracking-tight">
              filmkeyfi
            </p>
            <div className="h-6 w-10 shrink-0">
              <Image src={SLOT_DECOR.strip} alt="" className="h-full w-full" fittingType="fill" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-5 w-5">
              <Image src={SLOT_DECOR.reel} alt="" className="h-full w-full" fittingType="contain" />
            </div>
            <div className="h-5 w-7">
              <Image src={SLOT_DECOR.popcorn} alt="" className="h-full w-full" fittingType="contain" />
            </div>
            <div className="h-5 w-5">
              <Image src={SLOT_DECOR.seat} alt="" className="h-full w-full" fittingType="contain" />
            </div>
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