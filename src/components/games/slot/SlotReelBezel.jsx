import React from 'react';

// Sütun sınırları: beş makarayı birbirinden ayıran altın borular.
const DIVIDERS = [20, 40, 60, 80];

/** Makara penceresinin önündeki kabin katmanı: altın borular ve cam. */
export default function SlotReelBezel() {
  return (
    <span aria-hidden="true" className="absolute inset-0">
      <span className="slot-reel-glass absolute inset-0" />

      {DIVIDERS.map((left) => (
        <span key={left} className="slot-reel-pipe absolute top-0 h-full -translate-x-1/2" style={{ left: `${left}%`, width: '0.7%' }} />
      ))}
    </span>
  );
}