import { Gift } from 'lucide-react';
import { scoreTier } from '@/components/voice/scoreTier';

/** Hediye toplamı: eşiklere göre renk değişir. */
export default function VoiceSeatScore({ value = 0 }) {
  const tier = scoreTier(value);
  return (
    <span
      className="voice-gift-score mt-1 flex items-center gap-1 rounded-full border px-1.5 py-0.5"
      data-score-tier={tier}
    >
      <Gift className="h-2.5 w-2.5 shrink-0" />
      <span key={value} className="number-pop text-[10px] font-bold tabular-nums" aria-label={`${value} hediye puanı`}>
        {Number(value).toLocaleString('tr-TR')}
      </span>
    </span>
  );
}