import React from 'react';
import { Image } from '@/components/ui/image';
import { ART_SIZE, ELIMIN_SYMBOLS } from './eliminConfig';

/** Tek kare kart: meyve görseli kendi karesinin içinde kalır, komşusuna taşmaz. */
export default function EliminSymbol({ id, win }) {
  const symbol = ELIMIN_SYMBOLS[id];
  if (!symbol) return null;

  // Ek nesnelerin kendi parıltısı ve rozeti vardır: tavuk, zar, sandık.
  const tone = symbol.free ? 'el-sym-free' : symbol.jackpot ? 'el-sym-dice' : symbol.chest ? 'el-sym-chest' : '';

  return (
    <span className={`el-sym ${symbol.scatter ? 'el-sym-scatter' : ''} ${tone} ${win ? 'el-sym-win' : ''}`}>
      <Image
        src={symbol.art}
        alt={symbol.name}
        className="el-art"
        fittingType="fit"
        originWidth={ART_SIZE}
        originHeight={ART_SIZE}
        quality={88}
      />
    </span>
  );
}