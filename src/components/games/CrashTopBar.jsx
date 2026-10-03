import { Coins, FileText, HelpCircle } from 'lucide-react';
import { formatCoins } from '@/components/games/gameHelpers';

/** Crash üst çubuğu: bakiye, son tur çarpanları ve geçmiş/yardım düğmeleri. */
export default function CrashTopBar({ coins, recent = [], onOpenHistory, onOpenHelp }) {
  const iconButton = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-game-gold/30 bg-black/45 text-game-cream transition-transform active:scale-90';
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <span className="flex shrink-0 items-center gap-1 rounded-full border border-game-gold/35 bg-black/55 px-2.5 py-1.5 text-xs font-black tabular-nums text-white">
        <Coins className="h-3.5 w-3.5 text-game-neon-blue" />
        {formatCoins(coins)}
      </span>
      <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {recent.slice(0, 5).map((value, index) => (
          <span
            key={`${value}-${index}`}
            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black tabular-nums ${value >= 2 ? 'bg-game-orange text-white' : 'bg-game-space-light text-game-cream'}`}
          >
            {Number(value).toFixed(2)}
          </span>
        ))}
        <span className="shrink-0 text-[11px] font-black text-white/45">···</span>
      </div>
      <button type="button" onClick={onOpenHistory} aria-label="Tur geçmişi" className={iconButton}>
        <FileText className="h-4 w-4" />
      </button>
      <button type="button" onClick={onOpenHelp} aria-label="Yardım" className={iconButton}>
        <HelpCircle className="h-4 w-4" />
      </button>
    </div>
  );
}