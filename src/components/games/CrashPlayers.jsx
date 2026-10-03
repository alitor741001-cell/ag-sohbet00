import { Image } from '@/components/ui/image';
import { formatCoins } from '@/components/games/gameHelpers';

/** Crash turundaki oyuncular — bahis, çekilme çarpanı ve durum canlı güncellenir. */
export default function CrashPlayers({ players = [], currentUserId }) {
  const rows = [...players].reverse();
  return (
    <div className="rounded-2xl border border-game-neon/25 bg-black/45 p-2">
      <div className="flex items-center justify-between text-[9px] font-black tracking-[0.2em] text-game-neon/80">
        <span>OYUNCULAR</span>
        <span className="tabular-nums">{players.length}</span>
      </div>
      <div className="mt-1.5 max-h-44 space-y-1 overflow-y-auto">
        {rows.length === 0 && (
          <p className="py-3 text-center text-[11px] text-white/45">Şu an başka oyuncu yok — arkadaşlarını oyun merkezine davet et.</p>
        )}
        {rows.map((player) => (
          <div
            key={`${player.user_id}-${player.bet}`}
            className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 ${player.user_id === currentUserId ? 'border-game-gold/40 bg-game-gold/10' : 'border-white/10 bg-white/5'}`}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-[10px] font-bold text-white">
              {player.avatar
                ? <Image src={player.avatar} alt="" className="h-6 w-6 rounded-full" />
                : (player.name || '?').charAt(0)}
            </span>
            <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-white">{player.name || 'Oyuncu'}</span>
            <span className="shrink-0 text-[11px] font-black tabular-nums text-white/70">{formatCoins(player.bet)}</span>
            <span className={`shrink-0 text-[10px] font-black ${player.state === 'cashed' ? 'text-game-green' : player.state === 'lost' ? 'text-game-red' : 'text-game-neon'}`}>
              {player.state === 'cashed'
                ? `Çekti ${Number(player.cashout_multiplier || 0).toFixed(2)}x`
                : player.state === 'lost'
                  ? 'Kaybetti'
                  : 'Bekliyor'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}