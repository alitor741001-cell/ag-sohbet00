import { Settings, Trophy, Volume2, VolumeX } from 'lucide-react';

/** Alt çubuk: Ödül Tablosu, Ses ve Ayarlar. */
export default function GameFooter({ onOpenHelp, muted, onToggleSound, onOpenSettings }) {
  const item = 'flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold text-white/70 transition-transform active:scale-95';
  return (
    <footer className="flex shrink-0 items-center gap-1 border-t border-game-gold/20 bg-game-panel/80 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5">
      <button type="button" onClick={onOpenHelp} className={item}>
        <Trophy className="h-4 w-4 text-game-gold" />
        Ödül Tablosu
      </button>
      <button type="button" onClick={onToggleSound} className={item}>
        {muted ? <VolumeX className="h-4 w-4 text-game-gold" /> : <Volume2 className="h-4 w-4 text-game-gold" />}
        Ses
      </button>
      <button type="button" onClick={onOpenSettings} className={item}>
        <Settings className="h-4 w-4 text-game-gold" />
        Ayarlar
      </button>
    </footer>
  );
}