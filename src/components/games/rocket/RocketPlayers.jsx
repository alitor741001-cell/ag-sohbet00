import React from 'react';
import { Ticket, Users } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { format, formatMult } from './rocketConfig';

/** Her bahis alanı kendi satırında görünür: aynı oyuncunun iki bahsi ayrı yazılır. */
function betRows(bets) {
  return bets.map((b, index) => ({
    key: b.id || `${b.user_id}:${b.slot ?? 1}:${index}`,
    user_id: b.user_id,
    name: b.user_name,
    avatar: b.user_avatar,
    amount: b.bet || 0,
    active: b.status === 'active',
    cashout_at: b.status === 'cashed' ? b.cashout_at || 0 : 0,
  }));
}

/** Sol panel: uçuştaki ve çekilen bahisler, üstte tur boyunca yatırılan toplam. */
export default function RocketPlayers({ bets, me }) {
  const rows = betRows(bets || []);
  const active = rows.filter((r) => r.active);
  const cashed = rows.filter((r) => !r.active && r.cashout_at > 0).sort((a, b) => b.cashout_at - a.cashout_at);
  const ordered = [...active, ...cashed].slice(0, 30);
  // Yeni turda bahisler o turun kayıtlarıyla gelir: yatırılan toplam kendiliğinden sıfırlanır.
  const totalStake = rows.reduce((sum, r) => sum + r.amount, 0);
  const playerCount = new Set(rows.map((r) => r.user_id)).size;

  return (
    <aside className="rk-glass absolute bottom-2 left-2 top-2 z-10 flex w-[32%] max-w-[9.5rem] flex-col overflow-hidden rounded-xl">
      <div className="flex shrink-0 items-center gap-1.5 border-b border-white/10 px-2 py-1.5">
        <Users className="h-3 w-3 shrink-0 text-[#7fe4ff]" />
        <span className="truncate text-[10px] font-black tracking-wide text-white">Oyuncular {playerCount}</span>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-1 border-b border-white/10 px-2 py-1">
        <span className="truncate text-[9px] font-bold text-white/50">Yatırılan</span>
        <span className="shrink-0 text-[9px] font-black text-[#ffd35c]">{format(totalStake)}</span>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-1 py-1">
        {ordered.length === 0 && (
          <p className="px-1 py-2 text-[9px] leading-tight text-white/40">Henüz oyuncu yok</p>
        )}
        {ordered.map((row) => (
          <div
            key={row.key}
            className={`rk-row flex items-center gap-1 rounded-lg px-1 py-1 ${row.user_id === me ? 'rk-row-me' : ''}`}
          >
            {row.avatar ? (
              <Image src={row.avatar} alt="" className="h-5 w-5 shrink-0 rounded-full" fittingType="fill" quality={60} />
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
                <span className="shrink-0 text-[9px] font-black text-white">{format(row.amount)}</span>
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