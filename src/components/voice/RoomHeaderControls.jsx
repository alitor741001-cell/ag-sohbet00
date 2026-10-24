import { Power, Settings, UserRound } from 'lucide-react';
import '@/components/voice/voiceNeonBars.css';

export default function RoomHeaderControls({ viewerCount, onOpenViewers, canMod, menuHighlighted, onOpenMenu, onExit }) {
  return (
    <div className="neon-panel dragon-panel neon-glow flex shrink-0 items-center gap-1.5 p-1.5">
      <button type="button" onClick={onOpenViewers} aria-label={`Odada ${viewerCount} kişi var — izleyiciler`} className="neon-key neon-key-cyan h-10 min-w-10 gap-0.5 px-1.5">
        <UserRound className="h-5 w-5 fill-current" /><span className="text-sm font-bold tabular-nums">{viewerCount}</span>
      </button>
      {canMod && (
        <button type="button" onClick={onOpenMenu} aria-label="Oda ayarları" className={`neon-key neon-key-cyan relative h-10 w-10 ${menuHighlighted ? 'text-premium-gold' : ''}`}>
          <Settings className="h-5 w-5" />
        </button>
      )}
      <button type="button" onClick={onExit} aria-label="Odadan çık" className="neon-key neon-key-exit h-10 w-10">
        <Power className="h-5 w-5" strokeWidth={2.2} />
      </button>
    </div>
  );
}