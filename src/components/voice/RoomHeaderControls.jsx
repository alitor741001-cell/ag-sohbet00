import { MoreHorizontal, Power, UserRound } from 'lucide-react';

export default function RoomHeaderControls({ viewerCount, onOpenViewers, canMod, menuHighlighted, onOpenMenu, onExit }) {
  return (
    <div className="flex shrink-0 items-center gap-0 min-[375px]:gap-1.5">
      <button type="button" onClick={onOpenViewers} aria-label={`Odada ${viewerCount} kişi var — izleyiciler`} className="flex h-11 min-w-11 items-center justify-center gap-1 text-slot-text">
        <span className="flex items-center justify-center gap-1 rounded-full bg-slot-text/20 px-2 py-1.5">
          <UserRound className="h-4 w-4 fill-current" /><span className="text-sm tabular-nums">{viewerCount}</span>
        </span>
      </button>
      {canMod && (
        <button type="button" onClick={onOpenMenu} aria-label="Oda ayarları" className={`relative flex h-11 w-11 items-center justify-center ${menuHighlighted ? 'text-premium-gold' : 'text-slot-text'}`}>
          <MoreHorizontal className="h-7 w-7" />
          <span className="absolute right-1.5 top-1 h-2 w-2 rounded-full bg-primary" />
        </button>
      )}
      <button type="button" onClick={onExit} aria-label="Odadan çık" className="flex h-11 w-11 items-center justify-center text-slot-text">
        <Power className="h-7 w-7" strokeWidth={1.8} />
      </button>
    </div>
  );
}