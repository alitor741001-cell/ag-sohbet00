import { LogOut, RotateCcw, Video } from 'lucide-react';

/**
 * Alt panelin üst satırı: canlı yayın notu ve tur bittiğinde
 * "Maçtan ayrıl" ile "Rövanş" düğmeleri. Tek başına yayında düğmeler görünmez.
 */
export default function PkLiveNotice({ finished = false, onLeave, onRematch, rematchBusy = false }) {
  return (
    <div className="space-y-1">
      {finished && onLeave && (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onLeave}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-white/12 px-2 py-1 text-[10px] font-black text-white active:scale-95"
          >
            <LogOut className="h-3 w-3" /> Maçtan ayrıl
          </button>
          {onRematch && (
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
      )}

      <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2 py-1">
        <Video className="h-3 w-3 shrink-0 text-white/70" />
        <p className="text-[9.5px] font-semibold leading-snug text-white/70">
          CANLI Yayın maçı başladı! Yayıncına destek ol, hediye gönder.
        </p>
      </div>
    </div>
  );
}