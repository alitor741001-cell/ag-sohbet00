import React from 'react';
import { Image } from '@/components/ui/image';
import { SLOT_DECOR } from '../slotAssets';

const TIERS = {
  mega: { label: 'MEGA', accent: 'text-slot-red', ring: 'border-slot-red/70' },
  grand: { label: 'GRAND', accent: 'text-white', ring: 'border-slot-gold/70' },
  minor: { label: 'MINOR', accent: 'text-slot-blue', ring: 'border-slot-blue/70' },
  major: { label: 'MAJOR', accent: 'text-slot-red', ring: 'border-slot-red/70' },
  mini: { label: 'MINI', accent: 'text-slot-green', ring: 'border-slot-green/70' },
};

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

function JackpotBox({ tierKey, value, compact }) {
  const tier = TIERS[tierKey];
  return (
    <div className={`slot-panel-3d rounded-xl border px-1 py-1 text-center ${tier.ring}`}>
      <div className={`mx-auto ${compact ? 'h-3 w-3.5' : 'h-3.5 w-4'}`}>
        <Image src={SLOT_DECOR.crown} alt="" className="h-full w-full" fittingType="contain" />
      </div>
      <p className={`${compact ? 'text-[8px]' : 'text-[9px]'} font-black tracking-widest ${tier.accent}`}>
        {tier.label}
      </p>
      <p
        className={`slot-digits font-mono text-white ${compact ? 'text-[9px]' : 'text-[11px]'} font-black tabular-nums`}
      >
        {format(value)}
      </p>
    </div>
  );
}

function ReelEnd({ side }) {
  return (
    <div className="h-5 w-6 shrink-0">
      <Image
        src={SLOT_DECOR.reel}
        alt=""
        className={`h-full w-full ${side === 'left' ? '' : 'scale-x-[-1]'}`}
        fittingType="contain"
      />
    </div>
  );
}

export default function JackpotBar({ jackpots, progress }) {
  return (
    <div className="slot-metal mt-2 rounded-2xl p-2">
      <div className="flex items-stretch gap-1.5">
        <div className="w-[17%] self-center">
          <JackpotBox tierKey="major" value={jackpots?.major} compact />
        </div>

        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-3 gap-1.5">
            <JackpotBox tierKey="mega" value={jackpots?.mega} />
            <JackpotBox tierKey="grand" value={jackpots?.grand} />
            <JackpotBox tierKey="minor" value={jackpots?.minor} />
          </div>

          <div className="mt-1.5 flex items-center gap-1.5">
            <ReelEnd side="left" />
            <div className="relative h-4 flex-1 overflow-hidden rounded-full border border-slot-gold/40 bg-slot-surface">
              <div
                className="slot-progress-fill h-full rounded-full"
                style={{ width: `${Math.min(100, Math.max(6, (progress / 20) * 100))}%` }}
              />
              <span className="slot-digits absolute inset-0 flex items-center justify-center font-mono text-[9px] font-black tracking-wider text-white">
                {progress} / 20
              </span>
            </div>
            <ReelEnd side="right" />
          </div>
        </div>

        <div className="w-[17%] self-center">
          <JackpotBox tierKey="mini" value={jackpots?.mini} compact />
        </div>
      </div>
    </div>
  );
}