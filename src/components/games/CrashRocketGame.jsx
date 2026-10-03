import React from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { ROCKET_SCREEN } from './rocketAssets';

/** Crash Rocket: oyun ekranı görseli birebir, kırpılmadan gösterilir. */
export default function CrashRocketGame({ onExit, onBack }) {
  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-slot">
      <Image
        src={ROCKET_SCREEN}
        alt="Crash Rocket oyun ekranı"
        className="h-full w-full"
        fittingType="fit"
        originWidth={941}
        originHeight={1525}
        quality={92}
      />

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-2 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Oyun listesine dön"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onExit}
          aria-label="Oyunu kapat"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}