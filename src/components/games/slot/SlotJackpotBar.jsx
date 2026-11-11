import React, { useEffect, useState } from 'react';
import './slotFrenzy.css';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

// Plakada sırayla gösterilen havuzlar.
const POOLS = [
  { key: 'mini', label: 'MINI' },
  { key: 'big', label: 'BIG' },
  { key: 'mega', label: 'MEGA' },
  { key: 'xmega', label: 'XMEGA' },
  { key: 'jackpot', label: 'GRAND' },
];
const CYCLE_MS = 3000;

/** Referans tasarımdaki "Jackpot" plakası: havuzlar sırayla döner, altında ücretsiz çevirme şeridi. */
export default function SlotJackpotBar({ pools, freeSpins = 0, topGap = 0 }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % POOLS.length), CYCLE_MS);
    return () => window.clearInterval(timer);
  }, []);
  const pool = POOLS[index];

  return (
    <div className="relative shrink-0" style={{ paddingTop: `${topGap}px` }}>
      <div className="sfz-jp mx-auto w-full max-w-2xl">
        <span className="sfz-jp-script">Jackpot</span>
        <div className="sfz-jp-plate">
          <span className="sfz-jp-label">{pool.label}</span>
          <span key={pool.key} className="sfz-jp-value">{format(pools?.[pool.key])}</span>
        </div>
        <div className="sfz-jp-row">
          <span className="sfz-jp-track">Ücretsiz çevirme: {freeSpins}</span>
          <span aria-hidden="true" className="sfz-jp-wheel" />
        </div>
      </div>
    </div>
  );
}