import React from 'react';
import { Square } from 'lucide-react';
import '@/styles/gameControls.css';

/** Ana tur düğmesi: tur boyunca çevresinde ışık halkası döner, düğme DURDUR'a döner. */
export default function GameSpinButton({ spinning, disabled, auto, icon, onSpin, onStop, onAuto }) {
  const off = disabled && !spinning;
  const Icon = spinning ? Square : icon;

  return (
    <div className="flex w-full max-w-[27rem] flex-col items-center gap-2">
      <button
        type="button"
        onClick={spinning ? onStop : onSpin}
        disabled={off}
        aria-label={spinning ? 'Turu durdur' : 'Turu başlat'}
        className={`gctl-spin ${spinning ? 'gctl-spin-stop gctl-spin-live' : ''}`}
      >
        {spinning && <span className="gctl-spin-ring" aria-hidden="true" />}
        <Icon className="h-6 w-6" strokeWidth={2.6} />
        <span className="gctl-spin-label">{spinning ? 'DURDUR' : 'SPIN'}</span>
      </button>

      <button
        type="button"
        onClick={onAuto}
        aria-label="Otomatik tur"
        className={`gctl-pill ${auto ? 'gctl-pill-on' : ''}`}
      >
        {auto ? 'AUTOPLAY AÇIK' : 'AUTOPLAY'}
      </button>
    </div>
  );
}