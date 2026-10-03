import { Coins, HelpCircle, Play, Settings, Volume2, VolumeX, X } from 'lucide-react';
import { formatCoins } from '@/components/games/gameHelpers';

/** Oyun Merkezi üst çubuğu: logo, coin bakiyesi, ses/ayarlar/yardım ve kapatma. */
export default function GameHeader({ coins, muted, onToggleSound, onOpenSettings, onOpenHelp, onOpenHistory, onClose }) {
  const iconButton = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/85 transition-transform active:scale-90';
  return (
    <header className="flex shrink-0 items-center gap-1.5 border-b border-game-gold/20 bg-gradient-to-b from-game-panel to-game-bg px-2.5 py-2">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-game-red text-white">
          <Play className="h-3.5 w-3.5 fill-current" />
        </span>
        <span className="truncate text-xs font-black tracking-[0.18em] text-white">FILMKEYFİ</span>
      </div>
      <button
        type="button"
        onClick={onOpenHistory}
        title="Coin bakiyesi ve oyun geçmişi"
        className="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-game-gold/45 bg-game-gold/10 px-2.5 py-1 text-xs font-black tabular-nums text-game-gold"
      >
        <Coins className="h-3.5 w-3.5" />
        {formatCoins(coins)}
      </button>
      <button type="button" onClick={onToggleSound} aria-label="Ses aç/kapat" className={iconButton}>
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
      <button type="button" onClick={onOpenSettings} aria-label="Ayarlar" className={iconButton}>
        <Settings className="h-4 w-4" />
      </button>
      <button type="button" onClick={onOpenHelp} aria-label="Yardım" className={iconButton}>
        <HelpCircle className="h-4 w-4" />
      </button>
      <button type="button" onClick={onClose} aria-label="Kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-game-red text-white transition-transform active:scale-90">
        <X className="h-4 w-4" />
      </button>
    </header>
  );
}