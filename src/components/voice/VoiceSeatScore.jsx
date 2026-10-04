import { Gift } from 'lucide-react';
import { scoreTier } from '@/components/voice/scoreTier';
import useCountUp from '@/hooks/useCountUp';

/** Hediye toplamı: sınırsız ileri sayaç, eşiklere göre renk değişir. */
export default function VoiceSeatScore({ value = 0, compact = false }) {
  const display = useCountUp(value);
  const tone = scoreTier(value);
  return (
    <span
      className={`voice-gift-score mt-1 inline-flex items-center rounded-full border ${compact ? 'gap-0.5 px-1.5 py-1' : 'gap-1 px-2 py-1'}`}
      data-score-tier={tone}
    >
      {!compact && <Gift className="h-3 w-3 shrink-0" />}
      <span
        className={`number-pop text-center font-black tabular-nums ${compact ? 'text-[9px]' : 'text-[10px]'}`}
        aria-label={`${value} hediye puanı`}
      >
        {display.toLocaleString('tr-TR')}
      </span>
    </span>
  );
}