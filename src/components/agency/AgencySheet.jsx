import { X } from 'lucide-react';

/** Ajans panel ve formlarının ortak alt-kart kabuğu: alttan açılır, dışarı dokununca kapanır. */
export default function AgencySheet({ open, title, subtitle, icon: Icon, onClose, tall = false, full = false, children }) {
  if (!open) return null;
  return (
    <div className={`fixed inset-0 z-[320] ${full ? 'bg-[#0b0910]' : ''}`}>
      {!full && <button type="button" aria-label="Kapat" onClick={onClose} className="absolute inset-0 w-full bg-black/70" />}
      <div
        className={`animate-sheet-up absolute inset-x-0 bottom-0 flex flex-col overflow-hidden bg-[#0b0910] text-white ${full ? 'top-0' : `${tall ? 'h-[88vh]' : 'max-h-[80vh]'} rounded-t-[26px] border-t-2 border-[#F5C542]/40`}`}
      >
        {!full && (
          <div className="flex shrink-0 justify-center pb-1 pt-2.5">
            <span className="h-1.5 w-12 rounded-full bg-white/20" />
          </div>
        )}
        <header className={`flex shrink-0 items-center gap-3 px-4 pb-3 ${full ? 'pt-[max(0.75rem,env(safe-area-inset-top))]' : ''}`}>
          {Icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#F5C542]/50 bg-black/60 text-[#F5C542]">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-black">{title}</h2>
            {subtitle && <p className="truncate text-[11px] text-white/50">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 active:scale-95">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}