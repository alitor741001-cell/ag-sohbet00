import { Gift } from 'lucide-react';
import { formatScore, scoreTier } from '@/components/voice/scoreTier';

/**
 * Koltuk altı ileri sayaç: 1'den başlar, hediye geldikçe artar.
 * Sayı kısaltılır (5.530K, 1.537M), kutu yok — yazı şeffaf zeminde parlar.
 * Her hücre aynı genişlikte kaldığı için koltuk ızgarası kaymaz.
 */
export default function VoiceSeatScore({ value = 0 }) {
  const shown = Math.max(1, Math.round(Number(value) || 0));

  return (
    <span
      className="voice-gift-score mt-1 flex w-[56px] items-center justify-center gap-1"
      data-score-tier={scoreTier(shown)}
      aria-label={`${shown.toLocaleString('tr-TR')} sayaç`}
    >
      <Gift className="h-2.5 w-2.5 shrink-0" />
      <span key={shown} className="number-pop whitespace-nowrap text-[10px] font-bold tabular-nums">
        {formatScore(shown)}
      </span>
    </span>
  );
}