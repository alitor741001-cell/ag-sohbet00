import React from 'react';
import './slotFrenzy.css';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

// Plakanın altındaki dört havuz kapsülü.
const POOLS = [
  { key: 'mini', label: 'MINI', tone: 'sfz-pool-mini' },
  { key: 'big', label: 'BIG', tone: 'sfz-pool-big' },
  { key: 'mega', label: 'MEGA', tone: 'sfz-pool-mega' },
  { key: 'xmega', label: 'XMEGA', tone: 'sfz-pool-xmega' },
];

/** "Jackpot" plakası: ortada büyük GRAND havuzu, altında dört renkli havuz kapsülü. */
export default function SlotJackpotBar({ pools, topGap = 0 }) {
  return (
    <div className="relative shrink-0" style={{ paddingTop: `${topGap}px` }}>
      <div className="sfz-jp mx-auto w-full max-w-2xl">
        <span className="sfz-jp-script">Jackpot</span>
        <div className="sfz-jp-plate">
          <span className="sfz-jp-label">GRAND</span>
          <span className="sfz-jp-value">{format(pools?.jackpot)}</span>
        </div>
        <div className="sfz-pools">
          {POOLS.map((pool) => (
            <div key={pool.key} className={`sfz-pool ${pool.tone}`}>
              <span className="sfz-pool-label">{pool.label}</span>
              <span className="sfz-pool-value">{format(pools?.[pool.key])}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}