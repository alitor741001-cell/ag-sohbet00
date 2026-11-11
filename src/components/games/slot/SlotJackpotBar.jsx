import React from 'react';
import '@/components/games/slot/slotJackpot.css';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

// Küçük havuzlar: her biri kendi renginde parlayan cam kapsül.
const POOLS = [
  { key: 'mini', label: 'MINI', tone: 'mini' },
  { key: 'big', label: 'BIG', tone: 'big' },
  { key: 'mega', label: 'MEGA', tone: 'mega' },
  { key: 'xmega', label: 'XMEGA', tone: 'xmega' },
];

// Rakam uzadıkça yazı küçülür: kutunun dışına asla taşmaz.
const fit = (text, base, room) => `min(${base}cqw, ${(room / Math.max(text.length, 1)).toFixed(2)}cqw)`;

/** Oyunun üst konsolu: ortada büyük altın JACKPOT, altında dört renkli havuz kapsülü. */
export default function SlotJackpotBar({ pools, topGap = 0 }) {
  const jackpot = format(pools?.jackpot);
  return (
    <div className="relative shrink-0" style={{ paddingTop: `${topGap}px` }}>
      <div className="sjp mx-auto w-full max-w-2xl">
        <div className="sjp-main">
          <span className="sjp-main-shine" aria-hidden="true" />
          <span className="sjp-main-label">★ JACKPOT ★</span>
          <span className="sjp-main-value" style={{ fontSize: fit(jackpot, 8, 120) }}>{jackpot}</span>
        </div>
        <div className="sjp-row">
          {POOLS.map((pool) => {
            const text = format(pools?.[pool.key]);
            return (
              <div key={pool.key} className={`sjp-pool sjp-${pool.tone}`}>
                <span className="sjp-pool-label">{pool.label}</span>
                <span className="sjp-pool-value" style={{ fontSize: fit(text, 3.6, 30) }}>{text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}