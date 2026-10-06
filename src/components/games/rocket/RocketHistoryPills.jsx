import React from 'react';
import { colorForMult } from './rocketConfig';

const PILL = {
  blue: 'rk-pill-blue',
  green: 'rk-pill-green',
  yellow: 'rk-pill-yellow',
  red: 'rk-pill-red',
};

const text = (value) => (Math.round((value || 0) * 100) / 100).toFixed(2);

/** Son turların çakılma çarpanları: dört kapsül, yüksek çarpanlar yeşil görünür. */
export default function RocketHistoryPills({ history }) {
  const rows = (history || []).slice(0, 4);

  return (
    <div className="flex min-w-0 items-center gap-1 overflow-hidden">
      {rows.length === 0 && <span className="text-[9px] font-bold text-white/35">—</span>}
      {rows.map((row) => (
        <span
          key={row.round_no}
          className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-black ${PILL[colorForMult(row.crash_at)]}`}
        >
          {text(row.crash_at)}
        </span>
      ))}
    </div>
  );
}