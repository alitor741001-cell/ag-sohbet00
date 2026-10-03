import { Coins, FileText, HelpCircle, Settings, Volume2, VolumeX, X } from 'lucide-react';
import { formatCoins } from '@/components/games/gameHelpers';

/** Oyun üst çubuğu: coin bakiyesi, yardım, geçmiş, ayarlar, ses ve kapatma. */
export default function GameHeader({ coins, muted, onToggleSound, onOpenSettings, onOpenHelp, onOpenHistory, onClose }) {
  const iconButton = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-game-gold/30 bg-black/40 text-game-cream transition-transform active:scale-90';
  return (
    <header className="relative z-10 flex shrink-0 items-center gap-1.5 px-2.5 pb-1.5 pt-[max(0.6rem,env(safe-area-inset-top))]">
      <button
        type="button"
        onClick={onOpenHistory}
        title="Coin bakiyesi ve oyun geçmişi"
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-game-gold/45 bg-black/50 px-3 py-1.5 text-xs font-black tabular-nums text-white"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-game-cream text-game-deepest">
          <Coins className="h-3 w-3" />
        </span>
        {formatCoins(coins)}
      </button>
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <button type="button" onClick={onOpenHelp} aria-label="Yardım" className={iconButton}>
          <HelpCircle className="h-4 w-4" />
        </button>
        <button type="button" onClick={onOpenHistory} aria-label="Oyun geçmişi" className={iconButton}>
          <FileText className="h-4 w-4" />
        </button>
        <button type="button" onClick={onToggleSound} aria-label="Ses aç/kapat" className={iconButton}>
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button type="button" onClick={onOpenSettings} aria-label="Ayarlar" className={iconButton}>
          <Settings className="h-4 w-4" />
        </button>
        <button type="button" onClick={onClose} aria-label="Kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-game-red text-white transition-transform active:scale-90">
          <X className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}