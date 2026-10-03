import React from 'react';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

function StatPill({ label, value, tone }) {
  return (
    <div className="slot-panel-3d flex-1 rounded-full border border-slot-gold/50 px-2 py-1 text-center">
      <p className="text-[9px] font-black tracking-widest text-slot-gold">{label}</p>
      <p className={`slot-digits font-mono text-sm font-black tabular-nums ${tone || ''}`}>{format(value)}</p>
    </div>
  );
}

export default function SlotStatsRow({ lines, totalBet, win }) {
  return (
    <div className="flex gap-2">
      <StatPill label="LINES" value={lines} />
      <StatPill label="TOTAL BET" value={totalBet} />
      <StatPill label="WIN" value={win} tone={win > 0 ? 'text-slot-green' : 'text-slot-text'} />
    </div>
  );
}