import { Gift } from 'lucide-react';
import { scoreTier } from '@/components/voice/scoreTier';

/** Hediye toplamı: tam değer korunur ve eşiklere göre renk değişir. */
export default function VoiceSeatScore({ value = 0 }) {
  return (
    <span className="voice-gift-score mt-1 inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1" data-score-tier={scoreTier(value)}>
      <Gift className="h-3 w-3 shrink-0" />
      <span key={value} className="number-pop text-center text-[10px] font-black tabular-nums" aria-label={`${value} hediye puanı`}>
        {Number(value).toLocaleString('tr-TR')}
      </span>
    </span>
  );
}