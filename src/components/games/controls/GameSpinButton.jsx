import React from 'react';
import '@/components/games/controls/referenceControls.css';

/** Mavi AUTO düğmesi ve altın halkalı büyük yeşil SPIN; dönerken kırmızı STOP olur. */
export default function GameSpinButton({ spinning, disabled, spinDisabled, auto, onSpin, onStop, onAuto, extra }) {
  const off = !spinning && (spinDisabled ?? disabled);
  return (
    <div className="ref-spin-controls">
      <button type="button" onClick={onAuto} disabled={disabled} aria-pressed={!!auto} aria-label={auto ? 'Otomatik tur açık' : 'Otomatik tur'} className="ref-round ref-auto">AUTO</button>
      {extra ? <span className="ref-extra">{extra}</span> : null}
      <button type="button" onClick={spinning ? onStop : onSpin} disabled={off} data-stop={spinning ? '1' : undefined} aria-label={spinning ? 'Makaraları durdur' : 'Turu başlat'} className="ref-round ref-spin">
        {spinning ? 'STOP' : 'SPIN'}
      </button>
    </div>
  );
}