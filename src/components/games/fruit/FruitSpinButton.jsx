import React from 'react';
import { Play, Square } from 'lucide-react';

/** Yuvarlak spin butonu: tur sırasında kare DURDUR butonuna döner. */
export default function FruitSpinButton({ spinning, disabled, auto, onSpin, onStop, onAuto }) {
  const off = disabled && !spinning;
  return (
    <div className="flex w-full max-w-[26rem] flex-col items-center gap-2">
      <button
        type="button"
        onClick={spinning ? onStop : onSpin}
        disabled={off}
        aria-label={spinning ? 'Makaraları durdur' : 'Turu başlat'}
        className={`fruit-spin-btn ${spinning ? 'fruit-spin-btn-stop fruit-spin-btn-live' : ''} ${off ? 'opacity-50' : ''}`}
      >
        <span className="fruit-ring" aria-hidden="true" />
        {spinning ? <Square className="h-6 w-6" strokeWidth={3} /> : <Play className="h-6 w-6" strokeWidth={3} />}
        <span className="text-[10px] font-black tracking-[0.18em]">{spinning ? 'DURDUR' : 'SPIN'}</span>
      </button>

      <button
        type="button"
        onClick={onAuto}
        aria-label="Otomatik tur"
        className={`fruit-auto ${auto ? 'fruit-auto-on' : ''}`}
      >
        {auto ? 'AUTOPLAY AÇIK' : 'AUTOPLAY'}
      </button>
    </div>
  );
}