import { LogOut, RotateCcw, Settings2, UserPlus, X } from 'lucide-react';

/** Sağ alt köşedeki menü: davet, rövanş ve yayından ayrılma işlemleri. */
export default function PkControlMenu({
  open, onOpenChange, onInvite, onLeave, finished, onRematch, busy,
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-end gap-1.5 px-2 pb-1">
      {open && (
        <div className="pointer-events-auto w-44 overflow-hidden rounded-2xl bg-black/85 ring-1 ring-white/15 backdrop-blur">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[10px] font-black uppercase tracking-wide text-white/50">Yayın kontrolü</span>
            <button type="button" onClick={() => onOpenChange(false)} aria-label="Menüyü kapat" className="text-white/60">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={onInvite}
            className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-[11.5px] font-bold text-white active:bg-white/10"
          >
            <UserPlus className="h-4 w-4 text-[#fe2c55]" /> Arkadaşlarını davet et
          </button>
          {finished && onRematch && (
            <button
              type="button"
              onClick={onRematch}
              disabled={busy}
              className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-[11.5px] font-bold text-amber-200 active:bg-white/10 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" /> Rövanş başlat
            </button>
          )}
          <button
            type="button"
            onClick={onLeave}
            className="flex w-full items-center gap-2 border-t border-white/10 px-2.5 py-2 text-left text-[11.5px] font-bold text-red-300 active:bg-white/10"
          >
            <LogOut className="h-4 w-4" /> Yayından ayrıl
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-label="Yayın kontrolleri"
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-white ring-1 ring-white/25 backdrop-blur active:scale-95"
      >
        <Settings2 className="h-5 w-5" />
      </button>
    </div>
  );
}