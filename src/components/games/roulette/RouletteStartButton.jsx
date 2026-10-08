import React from 'react';
import { Play } from 'lucide-react';

/** Tur düğmesi: altın madalyonun yanında kalan saniyeyi gösteren sayaç durur. */
export default function RouletteStartButton({ spinning, ready, countdown, canSpin, onStart }) {
  const off = !ready || spinning;

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <span className="rl-stake-hint">{spinning ? 'ÇARK DÖNÜYOR' : canSpin ? 'HAZIR' : 'BAHİS BEKLENİYOR'}</span>

      <span className="flex items-center gap-2.5">
        <span className={`rl-countdown ${spinning ? 'rl-countdown-live' : ''}`}>{spinning ? countdown : '0'}</span>
        <span className="gctl-spin-socket">
          <button
            type="button"
            onClick={onStart}
            disabled={off || !canSpin}
            aria-label="Turu başlat"
            className={`gctl-spin ${spinning ? 'gctl-spin-live' : ''}`}
          >
            <span aria-hidden="true" className="gctl-spin-dome" />
            {spinning && <span className="gctl-spin-ring" aria-hidden="true" />}
            <Play className="relative h-6 w-6" strokeWidth={2.6} />
            <span className="gctl-spin-label">BAŞLA</span>
          </button>
        </span>
      </span>
    </div>
  );
}