import { X } from 'lucide-react';

/** Altın alt panel — koltuk menüsü gibi kartlar ekranın dibinden yarıya kadar yukarı kayarak açılır. */
export default function VoiceGoldSheet({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[250] flex flex-col justify-end">
      <button type="button" aria-label="Kapat" className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-sheet-up relative flex h-[50vh] supports-[height:100dvh]:h-[50dvh] w-full flex-col overflow-hidden rounded-t-[26px] bg-gradient-to-b from-[#2E2622] to-[#1D1815] ring-1 ring-[#D9C496]/30">
        <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-2 pt-4">
          <p className="text-sm font-bold text-[#F2CE6B]">{title}</p>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-full p-1.5 text-[#D9C496] transition-colors hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1">
          {children}
        </div>
      </div>
    </div>
  );
}