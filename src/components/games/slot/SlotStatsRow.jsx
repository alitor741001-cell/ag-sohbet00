import React from 'react';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

function StatBox({ label, value, tone }) {
  return (
    <div className="slot-metal flex-1 rounded-xl px-2 py-1.5 text-center">
      <p className="text-[9px] font-black tracking-widest text-slot-gold/80">{label}</p>
      <p className={`font-mono text-sm font-black tabular-nums ${tone || 'text-slot-text'}`}>{format(value)}</p>
    </div>
  );
}

export default function SlotStatsRow({ lines, totalBet, win }) {
  return (
    <div className="flex gap-2">
      <StatBox label="LINES" value={lines} />
      <StatBox label="TOTAL BET" value={totalBet} />
      <StatBox label="WIN" value={win} tone={win > 0 ? 'text-slot-green' : 'text-slot-text'} />
    </div>
  );
}