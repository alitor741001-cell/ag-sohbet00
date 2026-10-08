import React from 'react';
import { Square, Zap } from 'lucide-react';

/** Yuvarlak spin butonu: tur sırasında kare DURDUR butonuna döner. */
export default function DedeSpinButton({ spinning, disabled, auto, onSpin, onStop, onAuto }) {
  const off = disabled && !spinning;
  return (
    <div className="flex w-full max-w-[26rem] flex-col items-center gap-2">
      <button
        type="button"
        onClick={spinning ? onStop : onSpin}
        disabled={off}
        aria-label={spinning ? 'Turu durdur' : 'Turu başlat'}
        className={`dede-spin-btn ${spinning ? 'dede-spin-btn-stop dede-spin-btn-live' : ''} ${off ? 'opacity-50' : ''}`}
      >
        <span className="dede-ring" aria-hidden="true" />
        {spinning ? <Square className="h-6 w-6" strokeWidth={3} /> : <Zap className="h-6 w-6" strokeWidth={3} />}
        <span className="text-[10px] font-black tracking-[0.18em]">{spinning ? 'DURDUR' : 'SPIN'}</span>
      </button>

      <button
        type="button"
        onClick={onAuto}
        aria-label="Otomatik tur"
        className={`dede-auto ${auto ? 'dede-auto-on' : ''}`}
      >
        {auto ? 'AUTOPLAY AÇIK' : 'AUTOPLAY'}
      </button>
    </div>
  );
}