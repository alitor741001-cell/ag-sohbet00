import React from 'react';
import { Sparkles } from 'lucide-react';
import { formatCoins, pocketName, pocketTone } from './rouletteConfig';
import '@/styles/roulette.css';

/** Tur kazancı: kazanan sayı ve ödenen tutar gösterilir. */
export default function RouletteWinOverlay({ open, amount, number, onAccept }) {
  if (!open) return null;
  const tone = number === null || number === undefined ? 'gold' : pocketTone(number);

  return (
    <div className="rl-overlay absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="rl-overlay-title flex items-center gap-2">
        <Sparkles className="h-5 w-5" /> KAZANÇ
      </p>
      {number !== null && number !== undefined && (
        <span className={`rl-overlay-pocket rl-pocket-${tone}`}>
          {number} · {pocketName(number)}
        </span>
      )}
      <p className="rl-overlay-amount font-mono">{formatCoins(amount)}</p>
      <button type="button" onClick={onAccept} className="gctl-max">
        DEVAM ET
      </button>
    </div>
  );
}