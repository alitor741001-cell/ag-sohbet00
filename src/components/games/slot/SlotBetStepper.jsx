import React from 'react';
import { Minus, Plus } from 'lucide-react';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

const STEP_BUTTON = 'slot-step flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slot active:brightness-95 disabled:opacity-40';

/** Bahis kademesi: metal kapsül içinde − / + düğmeleri ve kademenin kendi değeri. */
export default function SlotBetStepper({ bet, disabled, onStep }) {
  return (
    <span className="slot-metal relative flex h-12 shrink-0 items-center gap-1 overflow-hidden rounded-full px-1.5">
      <span aria-hidden="true" className="slot-sheen-loop pointer-events-none absolute inset-0 opacity-25" />
      <button type="button" onClick={() => onStep(-1)} disabled={disabled} aria-label="Bahsi azalt" className={STEP_BUTTON}>
        <Minus className="h-4 w-4" strokeWidth={3} />
      </button>
      <span className="relative flex w-16 flex-col items-center leading-none">
        <span className="text-[8px] font-black uppercase tracking-[0.12em] text-slot-gold/80">BAHİS</span>
        <span className="slot-digits mt-0.5 font-mono text-sm font-black tabular-nums text-white">{format(bet)}</span>
      </span>
      <button type="button" onClick={() => onStep(1)} disabled={disabled} aria-label="Bahsi artır" className={STEP_BUTTON}>
        <Plus className="h-4 w-4" strokeWidth={3} />
      </button>
    </span>
  );
}