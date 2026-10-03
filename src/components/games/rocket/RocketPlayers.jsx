import React from 'react';
import { Image } from '@/components/ui/image';
import { format, formatMult } from './rocketConfig';
import { ROCKET_LAYOUT } from './rocketLayout';

/** Sol panel: oyuncular katıldıkça profilleri ve bahis miktarları görünür. */
export default function RocketPlayers({ bets, me }) {
  const active = bets.filter((b) => b.status === 'active');
  const cashed = bets.filter((b) => b.status === 'cashed');
  const ordered = [...active, ...cashed].slice(0, 30);

  return (
    <>
      <div
        className="absolute flex items-center rounded-md bg-black/55 px-2 text-[11px] font-black text-white"
        style={ROCKET_LAYOUT.playersHeader}
      >
        Oyuncular {bets.length}
      </div>
      <div
        className="absolute overflow-y-auto rounded-lg bg-black/45 p-1 no-scrollbar"
        style={ROCKET_LAYOUT.playersList}
      >
        <div className="flex flex-col gap-1">
          {ordered.length === 0 && (
            <p className="px-1 py-2 text-[10px] text-white/50">Henüz oyuncu yok</p>
          )}
          {ordered.map((b, i) => (
            <div
              key={`${b.user_id}-${i}`}
              className={`flex items-center gap-1.5 rounded px-1 py-1 ${b.user_id === me ? 'bg-amber-500/20 ring-1 ring-amber-400/50' : 'bg-slot/60'}`}
            >
              {b.user_avatar ? (
                <Image
                  src={b.user_avatar}
                  alt=""
                  className="h-5 w-5 shrink-0 rounded-full"
                  fittingType="fill"
                  quality={60}
                />
              ) : (
                <div className="h-5 w-5 shrink-0 rounded-full bg-slot-panel" />
              )}
              <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-white/90">
                {b.user_name || 'Oyuncu'}
              </span>
              {b.status === 'cashed' ? (
                <span className="text-[10px] font-black text-emerald-400">{formatMult(b.cashout_at)}</span>
              ) : (
                <span className="text-[10px] font-black text-amber-200">{format(b.bet)}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}