import React from 'react';
import { Film } from 'lucide-react';

const TIERS = [
  { key: 'mega', label: 'MEGA', tone: 'text-slot-red' },
  { key: 'grand', label: 'GRAND', tone: 'text-slot-gold' },
  { key: 'minor', label: 'MINOR', tone: 'text-slot-blue' },
  { key: 'mini', label: 'MINI', tone: 'text-slot-green' },
];

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

export default function JackpotBar({ jackpots, progress }) {
  return (
    <div className="slot-metal rounded-2xl p-2">
      <div className="grid grid-cols-4 gap-1.5">
        {TIERS.map((tier) => (
          <div key={tier.key} className="rounded-xl bg-slot-surface/80 px-1 py-1.5 text-center">
            <p className={`text-[9px] font-black tracking-widest ${tier.tone}`}>{tier.label}</p>
            <p className="font-mono text-[10px] font-bold tabular-nums text-slot-text">
              {format(jackpots?.[tier.key])}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Film className="h-4 w-4 shrink-0 text-slot-gold" />
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slot-surface">
          <div
            className="slot-progress-fill h-full rounded-full"
            style={{ width: `${Math.min(100, Math.max(5, (progress / 20) * 100))}%` }}
          />
        </div>
        <span className="font-mono text-[10px] font-bold tabular-nums text-slot-gold">{progress}/20</span>
      </div>
    </div>
  );
}