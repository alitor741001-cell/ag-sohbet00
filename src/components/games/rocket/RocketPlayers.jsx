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

/**
 * Sol kolon: üstte oyuncu sayısı ve tur boyunca yatırılan toplam coin,
 * altında bahis satırları (avatar + tutar). Sağ kenarında dikey çizgi ve
 * yukarı doğru döndürülmüş oyun adı durur.
 */
export default function RocketPlayers({ bets, me }) {
  const rows = betRows(bets || []);
  const active = rows.filter((r) => r.active);
  const cashed = rows.filter((r) => !r.active && r.cashout_at > 0).sort((a, b) => b.cashout_at - a.cashout_at);
  const ordered = [...active, ...cashed].slice(0, 30);
  // Yeni turda bahisler o turun kayıtlarıyla gelir: yatırılan toplam kendiliğinden sıfırlanır.
  const totalStake = rows.reduce((sum, r) => sum + r.amount, 0);
  const playerCount = new Set(rows.map((r) => r.user_id)).size;

  return (
    <aside className="rk-frame relative flex w-[36%] max-w-[9.5rem] shrink-0 flex-col overflow-hidden rounded-xl">
      <div className="flex shrink-0 items-center gap-1 border-b border-white/12 px-1.5 py-1">
        <Users className="h-3 w-3 shrink-0 text-[#5fc9ff]" />
        <span className="text-[10px] font-black text-white">{playerCount}</span>
        <Ticket className="ml-auto h-3 w-3 shrink-0 text-[#facd15]" />
        <span className="text-[10px] font-black text-[#facd15]">{format(totalStake)}</span>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto py-1 pl-1 pr-3">
        {ordered.length === 0 && (
          <p className="px-1 py-2 text-[9px] leading-tight text-white/45">Henüz oyuncu yok</p>
        )}
        {ordered.map((row) => (
          <div
            key={row.key}
            className={`flex items-center gap-1 rounded-md px-1 py-0.5 ${
              row.user_id === me ? 'bg-[#facd15]/15 ring-1 ring-[#facd15]/70' : 'bg-black/35'
            }`}
          >
            {row.avatar ? (
              <Image
                src={row.avatar}
                alt={row.name || ''}
                className="h-5 w-5 shrink-0 rounded-full"
                fittingType="fill"
                quality={60}
              />
            ) : (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] font-black text-white/70">
                {(row.name || '?').trim().charAt(0).toUpperCase()}
              </span>
            )}
            {row.active ? (
              <>
                <Ticket className="h-2.5 w-2.5 shrink-0 text-[#facd15]" />
                <span className="min-w-0 truncate text-[9px] font-black text-white">{format(row.amount)}</span>
              </>
            ) : (
              <span className="ml-auto shrink-0 text-[9px] font-black text-[#4ade80]">{formatMult(row.cashout_at)}</span>
            )}
          </div>
        ))}
      </div>

      {/* Dikey çizgi ve yukarı doğru döndürülmüş oyun adı. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-3.5">
        <span className="absolute inset-y-0 right-1.5 w-px bg-gradient-to-b from-transparent via-[#5fc9ff]/55 to-transparent" />
        <span className="rk-vtext absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">CRASH ROCKET</span>
      </div>
    </aside>
  );
}