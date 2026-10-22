import React from 'react';

/** "Başla" + geri sayım: bahis aşamasında Altın çember içinde saniyeler görünür. */
export default function RouletteRoundBar({ phase, countdown, progress }) {
  const betting = phase === 'betting';
  const spinning = phase === 'spinning';
  const label = betting ? 'BAŞLA' : spinning ? 'ÇARK DÖNÜYOR' : 'YENİ TUR';
  const showTimer = betting && countdown !== null && countdown !== undefined;
  const urgent = showTimer && countdown <= 3;

  return (
    <div className="rl-start-row">
      <span className="rl-start-text">{label}</span>
      {showTimer && (
        <span className={`rl-start-timer ${urgent ? 'rl-start-timer-urgent' : ''}`}>
          <span className="rl-start-count">{countdown}</span>
        </span>
      )}
    </div>
  );
}