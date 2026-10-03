import React from 'react';
import { Image } from '@/components/ui/image';
import { format, formatMult } from './rocketConfig';
import { ROCKET_LAYOUT } from './rocketLayout';

/** Aynı oyuncunun iki bahis alanı tek satırda toplanır. */
function groupBets(bets) {
  const map = new Map();
  bets.forEach((b) => {
    const row =
      map.get(b.user_id) || {
        user_id: b.user_id,
        name: b.user_name,
        avatar: b.user_avatar,
        activeTotal: 0,
        cashout_at: 0,
        active: false,
      };
    if (b.status === 'active') {
      row.active = true;
      row.activeTotal += b.bet || 0;
    }
    if (b.status === 'cashed') row.cashout_at = Math.max(row.cashout_at, b.cashout_at || 0);
    map.set(b.user_id, row);
  });
  return Array.from(map.values());
}

/** Sol panel: oyuncular katıldıkça profilleri ve bahis miktarları görünür. */
export default function RocketPlayers({ bets, me }) {
  const rows = groupBets(bets);
  const active = rows.filter((r) => r.active);
  const cashed = rows
    .filter((r) => !r.active && r.cashout_at > 0)
    .sort((a, b) => b.cashout_at - a.cashout_at);
  const ordered = [...active, ...cashed].slice(0, 24);

  return (
    <>
      <div
        className="absolute flex items-center rounded-md bg-black/70 px-2 text-[11px] font-black text-white"
        style={ROCKET_LAYOUT.playersHeader}
      >
        Oyuncular {rows.length}
      </div>
      <div
        className="absolute overflow-y-auto rounded-lg bg-black/60 p-1 no-scrollbar"
        style={ROCKET_LAYOUT.playersList}
      >
        <div className="flex flex-col gap-1">
          {ordered.length === 0 && <p className="px-1 py-2 text-[10px] text-white/50">Henüz oyuncu yok</p>}
          {ordered.map((row) => (
            <div
              key={row.user_id}
              className={`flex items-center gap-1.5 rounded px-1 py-1 ${
                row.user_id === me ? 'bg-amber-500/25 ring-1 ring-amber-400/60' : 'bg-black/50'
              }`}
            >
              {row.avatar ? (
                <Image
                  src={row.avatar}
                  alt=""
                  className="h-5 w-5 shrink-0 rounded-full"
                  fittingType="fill"
                  quality={60}
                />
              ) : (
                <div className="h-5 w-5 shrink-0 rounded-full bg-slot-panel" />
              )}
              <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-white/90">
                {row.name || 'Oyuncu'}
              </span>
              {row.active ? (
                <span className="text-[10px] font-black text-amber-200">{format(row.activeTotal)}</span>
              ) : (
                <span className="text-[10px] font-black text-emerald-400">{formatMult(row.cashout_at)}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}