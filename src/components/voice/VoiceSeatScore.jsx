import { Minus, Plus } from 'lucide-react';

/** Koltuk altındaki sayı tahtası hücresi: yeşil + artırır, kırmızı − azaltır, sayı sıfırdan yukarı sınırsız ilerler. */
export default function VoiceSeatScore({ value, canChange, onStep }) {
  return (
    <span className="mt-1 flex items-center gap-1 rounded-full border border-white/15 bg-black/60 px-1 py-0.5">
      <button
        type="button"
        onClick={() => onStep(-1)}
        disabled={!canChange || value <= 0}
        aria-label="Sayıyı azalt"
        className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600/85 text-white transition-transform active:scale-90 disabled:opacity-30"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span key={value} className="number-pop min-w-[20px] text-center text-xs font-black tabular-nums text-white">{value}</span>
      <button
        type="button"
        onClick={() => onStep(1)}
        disabled={!canChange}
        aria-label="Sayıyı artır"
        className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/90 text-white transition-transform active:scale-90 disabled:opacity-30"
      >
        <Plus className="h-3 w-3" />
      </button>
    </span>
  );
}