import { Image } from '@/components/ui/image';
import { formatCoins } from '@/components/games/gameHelpers';

/** Crash turundaki oyuncular — sol taraftaki dar liste. */
export default function CrashPlayers({ players = [], currentUserId }) {
  const rows = [...players].reverse();
  return (
    <div className="no-scrollbar flex h-full flex-col gap-1 overflow-y-auto rounded-xl border border-white/10 bg-black/45 p-1">
      {rows.length === 0 && <p className="px-1 py-3 text-center text-[9px] font-bold text-white/40">Oyuncu bekleniyor…</p>}
      {rows.map((player, index) => (
        <div
          key={`${player.user_id}-${index}`}
          className={`flex shrink-0 flex-col items-center gap-0.5 rounded-lg border px-1 py-1 ${player.user_id === currentUserId ? 'border-game-gold/45 bg-game-gold/10' : 'border-white/10 bg-white/5'}`}
        >
          <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-white/10 text-[10px] font-bold text-white">
            {player.avatar
              ? <Image src={player.avatar} alt="" className="h-6 w-6 rounded-full" />
              : (player.name || '?').charAt(0)}
          </span>
          <span className="flex items-center gap-0.5 text-[9px] font-black tabular-nums text-game-neon-blue">
            <span>🪙</span>
            <span className="text-white/85">{formatCoins(player.bet)}</span>
          </span>
          {player.state === 'cashed' && (
            <span className="text-[8px] font-black text-game-green">{Number(player.cashout_multiplier || 0).toFixed(2)}x</span>
          )}
        </div>
      ))}
    </div>
  );
}