import React from 'react';
import { Minus, Plus } from 'lucide-react';
import '@/styles/gameControls.css';

/** Bahis paneli: altın +/- düğmeleri, güncel kademe göstergesi ve MAX. */
export default function GameBetBar({ bet, lines, disabled, onStep, onMax, format }) {
  return (
    <div className="flex w-full max-w-[27rem] items-center gap-2">
      <button
        type="button"
        onClick={() => onStep(-1)}
        disabled={disabled}
        aria-label="Bahsi azalt"
        className="gctl-pill gctl-square"
      >
        <Minus className="h-4 w-4" strokeWidth={3} />
      </button>

      <div className="gctl-readout">
        <span className="gctl-readout-label">BAHİS KADEMESİ · {lines}X</span>
        <span className="gctl-readout-value">{format(bet)}</span>
        <span className="gctl-readout-sub">TOPLAM {format(bet * lines)}</span>
      </div>

      <button
        type="button"
        onClick={() => onStep(1)}
        disabled={disabled}
        aria-label="Bahsi artır"
        className="gctl-pill gctl-square"
      >
        <Plus className="h-4 w-4" strokeWidth={3} />
      </button>

      <button
        type="button"
        onClick={onMax}
        disabled={disabled}
        aria-label="En yüksek bahis"
        className="gctl-pill"
      >
        MAX
      </button>
    </div>
  );
}