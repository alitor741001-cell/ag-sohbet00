import React from 'react';
import ReferenceArt from '@/components/games/controls/ReferenceArt';
import FitGameText from '@/components/games/controls/FitGameText';

export default function GameBetBar({ bet, disabled, maxDisabled = disabled, onStep, onMax, format }) {
  return (
    <div className="ref-bet-controls">
      <ReferenceArt name="deck" />
      <div className="ref-bet-hotspots">
        <button type="button" onClick={() => onStep(-1)} disabled={disabled} aria-label="Bahsi azalt" className="ref-hotspot ref-step-minus"><span className="sr-only">−</span></button>
        <FitGameText className="ref-bet-value" style={{ fontSize: `${Math.min(4, 16 / Math.max(2, format(bet).length))}cqw` }}>{format(bet)}</FitGameText>
        <button type="button" onClick={() => onStep(1)} disabled={disabled} aria-label="Bahsi artır" className="ref-hotspot ref-step-plus"><span className="sr-only">+</span></button>
      </div>
      <button type="button" onClick={onMax} disabled={maxDisabled} aria-label="Maksimum bahis" className="ref-hotspot ref-max-hotspot"><span className="sr-only">MAX</span></button>
    </div>
  );
}