import React from 'react';
import FitGameText from '@/components/games/controls/FitGameText';
import '@/components/games/controls/referenceControls.css';

/** Bahis kapsülü: eksi, ortada bahis tutarı, artı; yanında altın MAX düğmesi. */
export default function GameBetBar({ bet, disabled, maxDisabled = disabled, onStep, onMax, format }) {
  return (
    <div className="ref-bet-controls">
      <div className="ref-bet-pill">
        <button type="button" onClick={() => onStep(-1)} disabled={disabled} aria-label="Bahsi azalt" className="ref-round ref-step">−</button>
        <span className="ref-bet-center">
          <span className="ref-bet-label">BAHİS</span>
          <FitGameText className="ref-bet-value">{format(bet)}</FitGameText>
        </span>
        <button type="button" onClick={() => onStep(1)} disabled={disabled} aria-label="Bahsi artır" className="ref-round ref-step">+</button>
      </div>
      <button type="button" onClick={onMax} disabled={maxDisabled} aria-label="Maksimum bahis" className="ref-round ref-max">MAX</button>
    </div>
  );
}