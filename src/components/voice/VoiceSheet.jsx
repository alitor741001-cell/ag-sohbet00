import { X } from 'lucide-react';

/** Sesli oda içi alt panel — menü, koltuk ve davet pencereleri için ortak kabuk. */
export default function VoiceSheet({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[245] flex flex-col justify-end">
      <button type="button" aria-label="Kapat" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative max-h-[86vh] w-full overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#12121a] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 text-white">
        <div className="mx-auto mb-3 flex w-full max-w-lg items-center justify-between gap-3">
          <p className="text-base font-bold">{title}</p>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-full bg-white/10 p-2">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mx-auto w-full max-w-lg">{children}</div>
      </div>
    </div>
  );
}