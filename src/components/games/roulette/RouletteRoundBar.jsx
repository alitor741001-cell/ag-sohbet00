import React from 'react';

/** "Başla" + altın kronometre: bahis aşamasında kalan saniye. */
export default function RouletteRoundBar({ phase, countdown }) {
  const betting = phase === 'betting';
  const label = betting ? 'Başla' : phase === 'spinning' ? 'Dönüyor' : 'Yeni tur';
  const showTimer = betting && countdown !== null && countdown !== undefined;
  return (
    <div className="rl2-start">
      <span className="rl2-start-text">{label}</span>
      {showTimer && (
        <span className={`rl2-watch ${countdown <= 3 ? 'rl2-watch-urgent' : ''}`}>{countdown}</span>
      )}
    </div>
  );
}