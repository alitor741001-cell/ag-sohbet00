import React from 'react';

// Sütun sınırları: beş makarayı birbirinden ayıran altın borular.
const DIVIDERS = [20, 40, 60, 80];
// Bordür ampulleri pencerenin iki yanına dizilir.
const BULB = 'slot-bulbs-y absolute inset-y-1 w-[4px] opacity-90';

/** Makara penceresinin önündeki kabin katmanı: altın borular, cam ve bordür ampulleri. */
export default function SlotReelBezel() {
  return (
    <span aria-hidden="true" className="absolute inset-0">
      <span className="slot-reel-glass absolute inset-0" />

      {DIVIDERS.map((left) => (
        <span key={left} className="slot-reel-pipe absolute top-0 h-full -translate-x-1/2" style={{ left: `${left}%`, width: '0.7%' }} />
      ))}

      <span className={BULB} style={{ left: '2px' }} />
      <span className={BULB} style={{ right: '2px' }} />

      {/* Orta satır nişanı: makinenin kazanç çizgisi ucu. */}
      <span className="absolute left-0 top-1/2 h-[2px] w-[12px] -translate-y-1/2 rounded-r-full bg-slot-gold/80" />
      <span className="absolute right-0 top-1/2 h-[2px] w-[12px] -translate-y-1/2 rounded-l-full bg-slot-gold/80" />
    </span>
  );
}