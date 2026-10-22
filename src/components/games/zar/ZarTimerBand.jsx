import React from 'react';

/** Masanın ortasındaki koyu şerit: "Tur Süresi" + turuncu kronometre. */
export default function ZarTimerBand({ phase, countdown }) {
  if (phase !== 'betting' || countdown === null || countdown === undefined) return null;
  return (
    <div className="zr2-band">
      <span>Tur Süresi</span>
      <span className={`zr2-watch ${countdown <= 3 ? 'zr2-watch-urgent' : ''}`}>{countdown}</span>
    </div>
  );
}