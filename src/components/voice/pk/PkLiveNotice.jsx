import { ChevronRight, RotateCcw, Ticket, Video } from 'lucide-react';

/** Alt panelin üst satırı: hediye ile PK puanı yükseltme ve tur bittiyse rövanş düğmesi. */
export default function PkLiveNotice({ onOpenGifts, finished = false, onRematch, rematchBusy = false }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenGifts}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-amber-400/15 px-2 py-1 text-left active:scale-[0.99]"
        >
          <Ticket className="h-3.5 w-3.5 shrink-0 text-amber-300" />
          <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-amber-200">
            Hediye gönder, PK puanını yükselt
          </span>
          <ChevronRight className="h-3 w-3 shrink-0 text-amber-200" />
        </button>

        {finished && onRematch && (
          <button
            type="button"
            onClick={onRematch}
            disabled={rematchBusy}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-fuchsia-500 px-2 py-1 text-[10px] font-black text-white active:scale-95 disabled:opacity-50"
          >
            <RotateCcw className="h-3 w-3" /> Rövanş
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2 py-1">
        <Video className="h-3 w-3 shrink-0 text-white/70" />
        <p className="text-[9.5px] font-semibold leading-snug text-white/70">
          CANLI Yayın maçı başladı! Yayıncına destek ol, hediye gönder.
        </p>
      </div>
    </div>
  );
}