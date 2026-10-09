import React from 'react';
import { Sparkles } from 'lucide-react';
import { DICE_TEAMS, formatCoins, outcomeName } from './zarConfig';
import ZarDie from './ZarDie';
import '@/styles/zar.css';

/** Tur kazancı: atılan zarlar, toplam ve ödenen tutar gösterilir. */
export default function ZarWinOverlay({ open, amount, dice, sum, outcome, onAccept }) {
  if (!open) return null;

  return (
    <div className="zar-overlay absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="zar-overlay-title flex items-center gap-2">
        <Sparkles className="h-5 w-5" /> KAZANÇ
      </p>
      {Array.isArray(dice) && (
        <span className="zar-overlay-dice">
          {dice.map((value, index) => <ZarDie key={index} value={value} team={DICE_TEAMS[index]} size="sm" />)}
        </span>
      )}
      {sum ? <span className="zar-overlay-sum">{sum} · {outcomeName(outcome)}</span> : null}
      <p className="zar-overlay-amount font-mono">{formatCoins(amount)}</p>
      <button type="button" onClick={onAccept} className="gctl-max">
        DEVAM ET
      </button>
    </div>
  );
}