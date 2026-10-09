import React from 'react';
import { Timer } from 'lucide-react';

/** Tur şeridi: "Tur Süresi" geri sayar, tur numarası ve aşama yazılır. */
export default function ZarRoundBar({ phase, countdown, progress, roundNo }) {
  const label = phase === 'betting'
    ? 'BAHİS AÇIK'
    : phase === 'shaking'
      ? 'ZARLAR ÇALKALANIYOR'
      : 'YENİ TUR HAZIRLANIYOR';
  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <div className="zar-round">
      <span className={`zar-round-count${phase === 'betting' ? ' zar-round-count-live' : ''}`}>
        {countdown === null ? '–' : countdown}
      </span>
      <span className="zar-round-body">
        <span className="zar-round-head">
          <span className="zar-round-label">
            <Timer className="h-3 w-3" strokeWidth={2.8} /> TUR SÜRESİ · {label}
          </span>
          <span className="zar-round-no">TUR: {roundNo || '–'}</span>
        </span>
        <span className="zar-round-track">
          <span className="zar-round-fill" style={{ width: `${percent}%` }} />
        </span>
      </span>
    </div>
  );
}