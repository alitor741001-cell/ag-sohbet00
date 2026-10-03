import React from 'react';
import { Ticket, Users } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { format, formatMult } from './rocketConfig';

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

/** Sol panel: oyuncular katıldıkça profil ve bahis miktarları canlı görünür. */
export default function RocketPlayers({ bets, me }) {
  const rows = groupBets(bets || []);
  const active = rows.filter((r) => r.active);
  const cashed = rows.filter((r) => !r.active && r.cashout_at > 0).sort((a, b) => b.cashout_at - a.cashout_at);
  const ordered = [...active, ...cashed].slice(0, 30);

  return (
    <aside className="rk-glass absolute bottom-2 left-2 top-2 flex w-[32%] max-w-[9.5rem] flex-col overflow-hidden rounded-xl">
      <div className="flex shrink-0 items-center gap-1 border-b border-white/10 px-2 py-1.5">
        <Users className="h-3 w-3 shrink-0 text-[#00d4ff]" />
        <span className="truncate text-[10px] font-black text-white">Oyuncular {rows.length}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1 py-1 no-scrollbar">
        {ordered.length === 0 && (
          <p className="px-1 py-2 text-[9px] leading-tight text-white/40">Henüz oyuncu yok</p>
        )}
        {ordered.map((row) => (
          <div
            key={row.user_id}
            className={`mb-1 flex items-center gap-1 rounded-lg px-1 py-1 ${
              row.user_id === me ? 'bg-[#ffb800]/20 ring-1 ring-[#ffb800]/50' : 'bg-black/35'
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
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] font-black text-white/70">
                {(row.name || '?').trim().charAt(0).toUpperCase()}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate text-[9px] font-bold text-white/85">
              {row.name || 'Oyuncu'}
            </span>
            {row.active ? (
              <>
                <Ticket className="h-2.5 w-2.5 shrink-0 text-[#ffb800]" />
                <span className="shrink-0 text-[9px] font-black text-white">{format(row.activeTotal)}</span>
              </>
            ) : (
              <span className="shrink-0 text-[9px] font-black text-emerald-400">{formatMult(row.cashout_at)}</span>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}