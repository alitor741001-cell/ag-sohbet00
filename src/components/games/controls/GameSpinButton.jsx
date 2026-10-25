import React from 'react';
import '@/components/games/controls/referenceControls.css';

export default function GameSpinButton({ spinning, disabled, spinDisabled, auto, onSpin, onStop, onAuto, extra }) {
  const off = !spinning && (spinDisabled ?? disabled);
  return (
    <div className="ref-spin-controls">
      <button type="button" onClick={onAuto} disabled={disabled} aria-pressed={!!auto} aria-label={auto ? 'Otomatik tur açık' : 'Otomatik tur'} className="ref-hotspot ref-auto-hotspot"><span className="sr-only">AUTO</span></button>
      {extra ? <span className="ref-extra">{extra}</span> : null}
      <button type="button" onClick={spinning ? onStop : onSpin} disabled={off} aria-label={spinning ? 'Makaraları durdur' : 'Turu başlat'} className="ref-hotspot ref-spin-hotspot">
        {spinning ? <span className="ref-stop-label">STOP</span> : <span className="sr-only">SPIN</span>}
      </button>
    </div>
  );
}