import React from 'react';
import { Image } from '@/components/ui/image';
import { SLOT_DECOR } from '../slotAssets';

const TIERS = {
  mega: { label: 'MEGA', accent: 'text-slot-red', ring: 'border-slot-red/70' },
  grand: { label: 'GRAND', accent: 'text-slot-gold', ring: 'border-slot-gold/70' },
  minor: { label: 'MINOR', accent: 'text-slot-blue', ring: 'border-slot-blue/70' },
  major: { label: 'MAJOR', accent: 'text-slot-pink', ring: 'border-slot-pink/70' },
  mini: { label: 'MINI', accent: 'text-slot-green', ring: 'border-slot-green/70' },
};

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

function JackpotBox({ tierKey, value }) {
  const tier = TIERS[tierKey];
  return (
    <div className={`slot-panel-3d rounded-xl border px-1 py-1 text-center ${tier.ring}`}>
      <div className="mx-auto h-3.5 w-4">
        <Image src={SLOT_DECOR.crown} alt="" className="h-full w-full" fittingType="contain" />
      </div>
      <p className={`text-[9px] font-black tracking-widest ${tier.accent}`}>{tier.label}</p>
      <p className="font-mono text-[11px] font-black tabular-nums text-slot-text">{format(value)}</p>
    </div>
  );
}

export default function JackpotBar({ jackpots, progress }) {
  return (
    <div className="slot-metal mt-2 rounded-2xl p-2">
      <div className="grid grid-cols-3 gap-1.5">
        <JackpotBox tierKey="mega" value={jackpots?.mega} />
        <JackpotBox tierKey="grand" value={jackpots?.grand} />
        <JackpotBox tierKey="minor" value={jackpots?.minor} />
      </div>

      <div className="mt-1.5 grid grid-cols-5 gap-1.5">
        <div className="col-span-2">
          <JackpotBox tierKey="major" value={jackpots?.major} />
        </div>
        <div className="col-span-1" />
        <div className="col-span-2">
          <JackpotBox tierKey="mini" value={jackpots?.mini} />
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="h-5 w-6 shrink-0">
          <Image src={SLOT_DECOR.reel} alt="" className="h-full w-full" fittingType="contain" />
        </div>
        <div className="relative h-3.5 flex-1 overflow-hidden rounded-full border border-slot-gold/40 bg-slot-surface">
          <div
            className="slot-progress-fill h-full rounded-full"
            style={{ width: `${Math.min(100, Math.max(6, (progress / 20) * 100))}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-black tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {progress} / 20
          </span>
        </div>
        <div className="h-5 w-6 shrink-0">
          <Image src={SLOT_DECOR.reel} alt="" className="h-full w-full" fittingType="contain" />
        </div>
      </div>
    </div>
  );
}