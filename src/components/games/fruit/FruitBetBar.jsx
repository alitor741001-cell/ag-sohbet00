import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { formatCoins } from './fruitConfig';

/** Bahis kademesi: eksi/artı, kademe katı ve toplam bahis. */
export default function FruitBetBar({ bet, lines, disabled, onStep, onMax }) {
  return (
    <div className="flex w-full max-w-[26rem] items-center gap-2">
      <button
        type="button"
        onClick={() => onStep(-1)}
        disabled={disabled}
        aria-label="Bahsi azalt"
        className="fruit-round"
      >
        <Minus className="h-4 w-4" strokeWidth={3} />
      </button>

      <div className="flex min-w-0 flex-1 flex-col items-center rounded-2xl border border-[#f0c46a]/60 bg-black/45 px-2 py-1">
        <span className="fruit-chip-label">BAHİS KADEMESİ · {lines}X</span>
        <span className="fruit-bubble-text text-sm">{formatCoins(bet)}</span>
        <span className="text-[9px] font-bold text-[#ffe9b8]/80">TOPLAM {formatCoins(bet * lines)}</span>
      </div>

      <button
        type="button"
        onClick={() => onStep(1)}
        disabled={disabled}
        aria-label="Bahsi artır"
        className="fruit-round"
      >
        <Plus className="h-4 w-4" strokeWidth={3} />
      </button>

      <button
        type="button"
        onClick={onMax}
        disabled={disabled}
        aria-label="En yüksek bahis"
        className="fruit-auto active:brightness-110"
      >
        MAX
      </button>
    </div>
  );
}