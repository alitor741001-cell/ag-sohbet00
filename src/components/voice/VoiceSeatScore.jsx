import { Gift } from 'lucide-react';
import { scoreTier } from '@/components/voice/scoreTier';

/** Koltuk altı ileri sayaç: 1'den başlar, hediye geldikçe artar. Eşiklere göre rengi belirginleşir. */
export default function VoiceSeatScore({ value = 0 }) {
  const shown = Math.max(1, Math.round(Number(value) || 0));
  const tier = scoreTier(shown);

  return (
    <span
      className="voice-gift-score mt-1 flex items-center gap-1 rounded-full border px-2 py-0.5"
      data-score-tier={tier}
      aria-label={`${shown.toLocaleString('tr-TR')} sayaç`}
    >
      <Gift className="h-2.5 w-2.5 shrink-0" />
      <span key={shown} className="number-pop text-[11px] font-bold tabular-nums">
        {shown.toLocaleString('tr-TR')}
      </span>
    </span>
  );
}