import React from 'react';
import EliminArt from './EliminArt';
import { ELIMIN_SYMBOLS } from './eliminConfig';

/** Tek kare kart: sembol görseli kendi karesinin içinde kalır, komşusuna taşmaz. */
export default function EliminSymbol({ id, win, explode }) {
  const symbol = ELIMIN_SYMBOLS[id];
  if (!symbol) return null;

  // Ek nesnelerin kendi parıltısı ve rozeti vardır: zar, sandık ve tavuk.
  const tone = symbol.jackpot
    ? 'el-sym-dice'
    : symbol.chest
      ? 'el-sym-chest'
      : symbol.free
        ? 'el-sym-chicken'
        : '';

  return (
    <span className={`el-sym ${symbol.scatter ? 'el-sym-scatter' : ''} ${tone} ${win ? 'el-sym-win' : ''} ${explode ? 'el-sym-explode' : ''}`}>
      <EliminArt src={symbol.art} alt={symbol.name} className="el-art" />
    </span>
  );
}