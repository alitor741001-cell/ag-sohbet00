import { X } from 'lucide-react';

/** Beyaz ortalanmış kart — koltuk ve profil menüleri için ortak çerçeve. */
export default function VoiceCard({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-[330px] overflow-y-auto rounded-2xl bg-white p-3 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <p className="text-sm font-bold text-[#1F2024]">{title}</p>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-full p-1.5 text-[#1F2024] transition-colors hover:bg-black/5">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}