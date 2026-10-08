import React from 'react';
import { Minus, Plus } from 'lucide-react';
import '@/styles/gameControls.css';

/** Bahis kademesi: tek metal kapsül içinde − / kademe / + ve yanında altın MAX. */
export default function GameBetBar({ bet, lines, disabled, onStep, onMax, format }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
      <span className="gctl-stepper">
        <button
          type="button"
          onClick={() => onStep(-1)}
          disabled={disabled}
          aria-label="Bahsi azalt"
          className="gctl-step"
        >
          <Minus className="h-4 w-4" strokeWidth={3} />
        </button>

        <span className="gctl-stepper-readout">
          <span className="gctl-stepper-label">BAHİS · {lines}X</span>
          <span className="gctl-stepper-value">{format(bet)}</span>
          <span className="gctl-stepper-sub">TOPLAM {format(bet * lines)}</span>
        </span>

        <button
          type="button"
          onClick={() => onStep(1)}
          disabled={disabled}
          aria-label="Bahsi artır"
          className="gctl-step"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
        </button>
      </span>

      <button type="button" onClick={onMax} disabled={disabled} aria-label="En yüksek bahis" className="gctl-max">
        MAX
      </button>
    </div>
  );
}