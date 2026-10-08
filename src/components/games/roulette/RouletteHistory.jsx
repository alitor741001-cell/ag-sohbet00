import React from 'react';
import { pocketTone } from './rouletteConfig';

/** Son turların çıkan numaraları: masa üzerindeki klasik geçmiş şeridi. */
export default function RouletteHistory({ entries }) {
  if (!entries?.length) return null;
  return (
    <div className="rl-history" aria-label="Son çıkan numaralar">
      {entries.map((entry) => (
        <span key={entry.round_no} className={`rl-history-pocket rl-pocket-${pocketTone(entry.number)}`}>
          {entry.number}
        </span>
      ))}
    </div>
  );
}