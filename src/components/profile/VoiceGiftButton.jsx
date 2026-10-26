import { Gift, Loader2 } from 'lucide-react';

/** Sesli oda profil kartındaki "Hediye Gönder" düğmesi: kartın farklı yerlerinde
    (takip et yanında, koltuktan in yanında, AG yetkilisi yanında) aynı görünür. */
export default function VoiceGiftButton({ onClick, busy = false, compact = false }) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={event => { event.stopPropagation(); onClick?.(); }}
      className={`voice-fantasy-button voice-fantasy-gift flex min-w-0 items-center justify-center gap-1.5 font-black disabled:opacity-50 ${compact ? 'rounded-xl px-2 py-1.5 text-[10px]' : 'min-h-12 rounded-xl px-5 py-2 text-[11px]'}`}
    >
      {busy ? <Loader2 className={`shrink-0 animate-spin ${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} /> : <Gift className={`shrink-0 ${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />}
      <span className="truncate">Hediye Gönder</span>
    </button>
  );
}