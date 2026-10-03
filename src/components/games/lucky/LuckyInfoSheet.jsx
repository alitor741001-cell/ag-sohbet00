import React from 'react';
import { X } from 'lucide-react';

/** Oyun içi bilgi katmanı: kurallar, menü ve ayarlar burada açılır. */
export default function LuckyInfoSheet({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-[210] flex flex-col justify-end bg-black/70" onClick={onClose} role="presentation">
      <div
        className="max-h-[82%] overflow-y-auto rounded-t-2xl border-t border-slot-gold/50 bg-slot-surface p-4 pb-6"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-black tracking-wide text-slot-gold">{title}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slot-panel text-slot-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}