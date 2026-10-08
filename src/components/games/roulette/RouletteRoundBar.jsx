import React from 'react';
import { Timer } from 'lucide-react';

/** Tur şeridi: bahis süresi geri sayar, çark dönerken yeni tura kalan saniye görünür. */
export default function RouletteRoundBar({ phase, countdown, progress }) {
  const label = phase === 'betting'
    ? 'BAHİS AÇIK'
    : phase === 'spinning'
      ? 'ÇARK DÖNÜYOR'
      : 'YENİ TUR HAZIRLANIYOR';
  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <div className="rl-roundbar">
      <span className={`rl-roundbar-count ${phase === 'betting' ? 'rl-roundbar-count-live' : ''}`}>
        {countdown === null ? '–' : countdown}
      </span>
      <span className="rl-roundbar-body">
        <span className="rl-roundbar-label">
          <Timer className="h-3 w-3" strokeWidth={2.8} /> {label}
        </span>
        <span className="rl-roundbar-track">
          <span className="rl-roundbar-fill" style={{ width: `${percent}%` }} />
        </span>
      </span>
    </div>
  );
}