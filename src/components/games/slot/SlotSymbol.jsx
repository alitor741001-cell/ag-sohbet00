import React from 'react';
import { Image } from '@/components/ui/image';
import { SLOT_SYMBOLS } from './slotSymbols';

export default function SlotSymbol({ id }) {
  const symbol = SLOT_SYMBOLS[id] || SLOT_SYMBOLS.ten;

  if (symbol.image) {
    return (
      <div className="relative h-full w-full">
        <Image src={symbol.image} alt={id} className="h-full w-full" fittingType="fill" />
        {symbol.wild && (
          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded bg-slot-green px-1 text-[8px] font-black tracking-widest text-slot">
            WILD
          </span>
        )}
      </div>
    );
  }

  return (
    <span className="slot-gold-text font-display text-2xl font-black tracking-tight sm:text-3xl">{symbol.label}</span>
  );
}