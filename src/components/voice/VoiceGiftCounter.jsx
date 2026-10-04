import { Gift } from 'lucide-react';

/** Sayı tahtası sayacı: odada toplanan toplam hediye. Koltukların hemen altında, yalnızca sayı tahtası açıkken görünür. */
export default function VoiceGiftCounter({ total = 0 }) {
  return (
    <div className="slot-metal mx-auto mt-4 flex w-full max-w-md items-center justify-center gap-2 rounded-2xl px-4 py-2" aria-label="Toplam hediye sayacı">
      <Gift className="h-4 w-4 shrink-0 text-slot-gold" />
      <span className="text-[11px] font-bold uppercase tracking-wide text-slot-text/70">Toplam hediye</span>
      <span key={total} className="number-pop slot-gold-text slot-digits text-xl font-black tabular-nums">
        {Math.max(0, Number(total) || 0).toLocaleString('tr-TR')}
      </span>
    </div>
  );
}