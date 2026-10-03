import React from 'react';
import { Minus, Plus } from 'lucide-react';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

export default function SlotBetDeck({ bet, auto, spinning, onBet, onAuto }) {
  return (
    <div className="flex items-stretch gap-2">
      <div className="slot-panel-3d flex flex-1 items-center gap-1.5 rounded-2xl border border-slot-gold/50 p-1.5">
        <button
          type="button"
          onClick={() => onBet(-1)}
          disabled={spinning}
          aria-label="Bahsi azalt"
          className="slot-step flex h-10 w-10 items-center justify-center rounded-xl text-slot"
        >
          <Minus className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-[9px] font-black tracking-[0.2em] text-slot-gold">BET</p>
          <p className="slot-digits font-mono text-lg font-black leading-tight tabular-nums text-white">{format(bet)}</p>
        </div>
        <button
          type="button"
          onClick={() => onBet(1)}
          disabled={spinning}
          aria-label="Bahsi artır"
          className="slot-step flex h-10 w-10 items-center justify-center rounded-xl text-slot"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <button
        type="button"
        onClick={onAuto}
        aria-label="Otomatik tur"
        className={`slot-auto w-20 shrink-0 rounded-xl text-xs font-black tracking-widest text-slot ${
          auto ? 'ring-2 ring-slot-green' : ''
        }`}
      >
        AUTO
      </button>
    </div>
  );
}