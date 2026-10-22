import React from 'react';
import { Image } from '@/components/ui/image';
import { format, formatMult } from '../rocket/rocketConfig';

/** Otobüs roket sol paneli: avatar + coin miktarı, çekilense yeşil çarpan.
 *  Normal roketin RocketPlayers bileşeninin otobüs temasına uyarlanmış hali. */
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

export default function OtobusPlayers({ bets }) {
  const rows = betRows(bets || []);
  const active = rows.filter((r) => r.active);
  const cashed = rows
    .filter((r) => !r.active && r.cashout_at > 0)
    .sort((a, b) => b.cashout_at - a.cashout_at);
  const ordered = [...active, ...cashed].slice(0, 30);

  return (
    <aside className="absolute bottom-2 left-2 top-2 z-10 flex w-[28%] max-w-[8rem] flex-col overflow-hidden rounded-xl border border-[#2f5140]/60 bg-[#0a1711]/85 backdrop-blur-sm">
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-1.5 py-1.5">
        {ordered.length === 0 && (
          <p className="px-1 py-2 text-[9px] leading-tight text-[#7f9a8b]">Henüz oyuncu yok</p>
        )}
        {ordered.map((row) => {
          const isCashed = !row.active && row.cashout_at > 0;
          return (
            <div key={row.key} className="flex items-center gap-1.5">
              <div
                className={`relative shrink-0 rounded-full p-[1.5px] ${
                  isCashed
                    ? 'bg-gradient-to-br from-[#ffd700] to-[#b8860b]'
                    : 'bg-gradient-to-br from-[#3d8f5f] to-[#2a6b45]'
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
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0a1711] text-[9px] font-black text-[#cfe3d6]">
                    {(row.name || '?').trim().charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex min-w-0 flex-col leading-none">
                {isCashed && (
                  <span className="text-[10px] font-black text-[#6fd39a]">
                    {formatMult(row.cashout_at)}
                  </span>
                )}
                <div className="flex items-center gap-0.5">
                  <span className="text-[8px] text-[#f6c65b]">🪙</span>
                  <span className="text-[10px] font-bold text-white">{format(row.amount)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dikey "OTOBÜS ROKET" etiketi */}
      <div className="flex shrink-0 items-center justify-center border-t border-[#2f5140]/40 py-1">
        <span
          className="text-[9px] font-black tracking-[0.18em] text-transparent"
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            WebkitTextStroke: '0.5px #ffe9a8',
            textShadow: '0 0 4px rgba(246,198,91,0.3)',
          }}
        >
          OTOBÜS ROKET
        </span>
      </div>
    </aside>
  );
}