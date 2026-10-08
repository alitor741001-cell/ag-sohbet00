import React from 'react';
import { Square } from 'lucide-react';
import '@/styles/gameControls.css';

/** Alt sıra: solda AUTO anahtarı, sağda kubbeli altın tur madalyonu; tur boyunca ışık halkası döner.
    `extra`: tur madalyonunun soluna yerleşen isteğe bağlı alan (DEDE'de biriken çarpan çemberi). */
export default function GameSpinButton({ spinning, disabled, auto, icon, onSpin, onStop, onAuto, extra }) {
  const off = disabled && !spinning;
  const Icon = spinning ? Square : icon;

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={onAuto}
        aria-label={auto ? 'Otomatik tur açık' : 'Otomatik tur'}
        className={`gctl-auto ${auto ? 'gctl-auto-on' : ''}`}
      >
        <span aria-hidden="true" className="gctl-auto-lamp" />
        <span className="gctl-auto-label">AUTO</span>
      </button>

      <div className="flex items-center gap-2">
        {extra}
        <span className="gctl-spin-socket">
          <button
            type="button"
            onClick={spinning ? onStop : onSpin}
            disabled={off}
            aria-label={spinning ? 'Turu durdur' : 'Turu başlat'}
            className={`gctl-spin ${spinning ? 'gctl-spin-stop gctl-spin-live' : ''}`}
          >
            <span aria-hidden="true" className="gctl-spin-dome" />
            {spinning && <span className="gctl-spin-ring" aria-hidden="true" />}
            <Icon className="relative h-5 w-5" strokeWidth={2.6} />
            <span className="gctl-spin-label">{spinning ? 'DURDUR' : 'SPIN'}</span>
          </button>
        </span>
      </div>
    </div>
  );
}