import React from 'react';
import { Minus, Plus } from 'lucide-react';
import '@/styles/gameControls.css';
import '@/styles/slot.css';
import SlotMedallionButton from '../slot/SlotMedallionButton';
import { SLOT_BUTTON_ART } from '@/components/games/slotAssets';

// Slot masasındaki altın kademe düğmeleri.
const STEP = 'slot-step flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slot active:brightness-95 disabled:opacity-40';

/** Bahis kademesi: slot masasındaki çelik kapsül içinde − / BAHİS / + ve aslan madalyonlu MAX. */
export default function GameBetBar({ bet, disabled, onStep, onMax, format }) {
  return (
    <div className="flex min-w-fit flex-1 items-center gap-1.5">
      <span className="slot-metal relative flex h-11 shrink-0 items-center gap-1 overflow-hidden rounded-full px-1">
        <span aria-hidden="true" className="slot-sheen-loop pointer-events-none absolute inset-0 opacity-25" />
        <button type="button" onClick={() => onStep(-1)} disabled={disabled} aria-label="Bahsi azalt" className={STEP}>
          <Minus className="h-3.5 w-3.5" strokeWidth={3} />
        </button>

        <span className="relative flex w-14 shrink-0 flex-col items-center leading-none">
          <span className="text-[8px] font-black uppercase tracking-[0.12em] text-slot-gold/80">BAHİS</span>
          <span className="slot-digits mt-0.5 w-full truncate text-center font-mono text-[0.85rem] font-black tabular-nums text-white">
            {format(bet)}
          </span>
        </span>

        <button type="button" onClick={() => onStep(1)} disabled={disabled} aria-label="Bahsi artır" className={STEP}>
          <Plus className="h-3.5 w-3.5" strokeWidth={3} />
        </button>
      </span>

      <SlotMedallionButton
        art={SLOT_BUTTON_ART.lion}
        label="MAX"
        size="xs"
        className="slot-max text-white"
        disabled={disabled}
        onClick={onMax}
        ariaLabel="Maksimum bahis"
      />
    </div>
  );
}