import React from 'react';
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

/** Sol panel: avatar + coin miktarı, çekilense üstte yeşil çarpan. İsim yok. */
export default function RocketPlayers({ bets, me }) {
  const rows = betRows(bets || []);
  const active = rows.filter((r) => r.active);
  const cashed = rows
    .filter((r) => !r.active && r.cashout_at > 0)
    .sort((a, b) => b.cashout_at - a.cashout_at);
  const ordered = [...active, ...cashed].slice(0, 30);

  return (
    <aside className="absolute bottom-2 left-2 top-2 z-10 flex w-[30%] max-w-[8.5rem] flex-col overflow-hidden rounded-xl border border-white/5 bg-[#0a0f24]/85 backdrop-blur-sm">
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-1.5 py-1.5">
        {ordered.length === 0 && (
          <p className="px-1 py-2 text-[9px] leading-tight text-white/40">Henüz oyuncu yok</p>
        )}
        {ordered.map((row) => {
          const cashed = !row.active && row.cashout_at > 0;
          return (
            <div key={row.key} className="flex items-center gap-1.5">
              <div
                className={`relative shrink-0 rounded-full p-[1.5px] ${
                  cashed ? 'bg-gradient-to-br from-[#ffd700] to-[#b8860b]' : 'bg-gradient-to-br from-[#2e71d3] to-[#1e4a9e]'
                }`}
              >
                {row.avatar ? (
                  <Image
                    src={row.avatar}
                    alt=""
                    className="h-6 w-6 rounded-full"
                    fittingType="fill"
                    quality={60}
                  />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0a0f24] text-[9px] font-black text-white/70">
                    {(row.name || '?').trim().charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex min-w-0 flex-col leading-none">
                {cashed && (
                  <span className="text-[10px] font-black text-[#4caf50]">
                    {formatMult(row.cashout_at)}
                  </span>
                )}
                <div className="flex items-center gap-0.5">
                  <span className="text-[8px] text-[#a0cfff]">🪙</span>
                  <span className="text-[10px] font-bold text-white">{format(row.amount)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dikey "CRASH ROCKET" etiketi */}
      <div className="flex shrink-0 items-center justify-center border-l border-white/5 py-1">
        <span
          className="text-[9px] font-black tracking-[0.2em] text-transparent"
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            WebkitTextStroke: '0.5px #ffd700',
            textShadow: '0 0 4px rgba(255,215,0,0.3)',
          }}
        >
          CRASH ROCKET
        </span>
      </div>
    </aside>
  );
}