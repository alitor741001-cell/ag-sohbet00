import { X } from 'lucide-react';

/** Oyun Merkezi alt sayfası (geçmiş, yardım, ayarlar). */
export default function GameSheet({ open, title, subtitle, onClose, children }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/65">
      <button type="button" aria-label="Kapat" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div className="game-rise relative max-h-[82%] overflow-y-auto rounded-t-3xl border-t border-game-gold/30 bg-game-panel px-3 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-2.5">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black tracking-[0.16em] text-game-gold">{title}</h3>
            {subtitle && <p className="text-[11px] text-white/55">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2.5">{children}</div>
      </div>
    </div>
  );
}