import { X } from 'lucide-react';

/** Koyu altın kart — koltuk, davet ve izleyici menüleri için ortak çerçeve. */
export default function VoiceCard({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="relative max-h-[80vh] w-full max-w-[330px] overflow-y-auto rounded-[26px] bg-gradient-to-b from-[#2E2622] to-[#1D1815] p-3 shadow-[0_20px_55px_-14px_rgba(0,0,0,0.9)] ring-1 ring-[#D9C496]/30"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <p className="text-sm font-bold text-[#F2CE6B]">{title}</p>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-full p-1.5 text-[#D9C496] transition-colors hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}