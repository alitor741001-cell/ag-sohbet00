import React from 'react';
import { colorForMult, formatMult, MULT_PILL_CLASS } from './rocketConfig';

/** Son turların çakılma çarpanları: 0-2 mavi, 2-8 yeşil, 8-25 sarı, 25-500 kırmızı. */
export default function RocketRecent({ history }) {
  const rows = (history || []).slice(0, 7);

  return (
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto no-scrollbar">
      <span className="shrink-0 text-[8px] font-bold text-white/45">Son Kazançlar</span>
      {rows.length === 0 && <span className="text-[8px] text-white/30">—</span>}
      {rows.map((h) => (
        <span
          key={h.round_no}
          className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-black ${MULT_PILL_CLASS[colorForMult(h.crash_at)]}`}
        >
          {formatMult(h.crash_at)}
        </span>
      ))}
    </div>
  );
}