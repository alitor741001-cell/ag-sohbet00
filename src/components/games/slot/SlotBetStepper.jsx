import React from 'react';
import { Minus, Plus } from 'lucide-react';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

const STEP_BUTTON = 'slot-step flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slot active:brightness-95 disabled:opacity-40';

/** Bahis kademesi: − ve + düğmeleri arasında kademenin kendi değeri durur. */
export default function SlotBetStepper({ bet, disabled, onStep }) {
  return (
    <span className="slot-metal flex h-11 shrink-0 items-center gap-1 rounded-full px-1">
      <button type="button" onClick={() => onStep(-1)} disabled={disabled} aria-label="Bahsi azalt" className={STEP_BUTTON}>
        <Minus className="h-4 w-4" strokeWidth={3} />
      </button>
      <span className="flex w-16 flex-col items-center leading-none">
        <span className="text-[9px] font-black uppercase tracking-[0.08em] text-slot-gold/70">BAHİS</span>
        <span className="slot-digits mt-0.5 font-mono text-sm font-black tabular-nums text-white">{format(bet)}</span>
      </span>
      <button type="button" onClick={() => onStep(1)} disabled={disabled} aria-label="Bahsi artır" className={STEP_BUTTON}>
        <Plus className="h-4 w-4" strokeWidth={3} />
      </button>
    </span>
  );
}