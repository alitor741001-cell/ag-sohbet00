import React from 'react';
import { formatMult, colorForMult, MULT_PILL_CLASS } from './rocketConfig';
import { ROCKET_LAYOUT } from './rocketLayout';

/** Üst sağ şerit: son turların çakılma çarpanları, renk bantlarına göre. */
export default function RocketRecent({ history }) {
  return (
    <div
      className="absolute flex items-center gap-1 overflow-x-auto rounded-md bg-black/80 px-1.5 py-1 no-scrollbar"
      style={ROCKET_LAYOUT.recentValues}
    >
      {history.length === 0 && (
        <span className="text-[10px] font-bold text-white/40">Son kazançlar burada görünür</span>
      )}
      {history.slice(0, 7).map((h) => {
        const c = colorForMult(h.crash_at);
        return (
          <span
            key={h.round_no}
            className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-black ${MULT_PILL_CLASS[c]}`}
          >
            {formatMult(h.crash_at)}
          </span>
        );
      })}
    </div>
  );
}