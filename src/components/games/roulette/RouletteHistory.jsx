import React from 'react';
import { pocketTone } from './rouletteConfig';

/** Son turların çıkan numaraları: masa üzerindeki klasik geçmiş şeridi. */
export default function RouletteHistory({ spins }) {
  if (!spins.length) return null;
  return (
    <div className="rl-history" aria-label="Son çıkan numaralar">
      {spins.map((spin) => (
        <span key={spin.id} className={`rl-history-pocket rl-pocket-${pocketTone(spin.number)}`}>
          {spin.number}
        </span>
      ))}
    </div>
  );
}