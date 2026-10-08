import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { formatCoins } from './dedeConfig';

/** Bahis kademesi: eksi/artı, kademe katı ve toplam bahis. */
export default function DedeBetBar({ bet, lines, disabled, onStep, onMax }) {
  return (
    <div className="flex w-full max-w-[26rem] items-center gap-2">
      <button
        type="button"
        onClick={() => onStep(-1)}
        disabled={disabled}
        aria-label="Bahsi azalt"
        className="dede-round"
      >
        <Minus className="h-4 w-4" strokeWidth={3} />
      </button>

      <div className="flex min-w-0 flex-1 flex-col items-center rounded-2xl border border-[#ffd35c]/60 bg-black/45 px-2 py-1">
        <span className="dede-chip-label">BAHİS KADEMESİ · {lines}X</span>
        <span className="dede-title text-sm">{formatCoins(bet)}</span>
        <span className="text-[9px] font-bold text-[#ffe9a8]/80">TOPLAM {formatCoins(bet * lines)}</span>
      </div>

      <button
        type="button"
        onClick={() => onStep(1)}
        disabled={disabled}
        aria-label="Bahsi artır"
        className="dede-round"
      >
        <Plus className="h-4 w-4" strokeWidth={3} />
      </button>

      <button
        type="button"
        onClick={onMax}
        disabled={disabled}
        aria-label="En yüksek bahis"
        className="dede-auto active:brightness-110"
      >
        MAX
      </button>
    </div>
  );
}