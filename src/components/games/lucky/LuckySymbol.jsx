import React from 'react';
import { Image } from '@/components/ui/image';
import { SYMBOL_TILES } from '@/components/games/lucky/luckyConfig';

export default function LuckySymbol({ symbol, multiplier }) {
  return (
    <span className="block h-full w-full px-[6%] py-[5%]">
      {symbol === 'multi' ? (
        <span className="flex h-full w-full items-center justify-center rounded-lg border border-slot-gold bg-slot-blue text-slot-text">
          <span className="text-lg font-black">x{multiplier || 2}</span>
        </span>
      ) : (
        <Image src={SYMBOL_TILES[symbol] || SYMBOL_TILES.crown} alt="" fittingType="fit" className="block h-full w-full object-contain" />
      )}
    </span>
  );
}