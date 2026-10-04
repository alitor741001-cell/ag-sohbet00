import { formatScore, scoreTier } from '@/components/voice/scoreTier';

/**
 * Koltuk altı ileri sayaç: 1'den başlar, hediye geldikçe artar.
 * Profilin altında şerit rozet içinde gösterilir; rakamlar beyaz,
 * yalnızca rozetin rengi hediye seviyesine göre değişir.
 * Her hücre aynı genişlikte kaldığı için koltuk ızgarası kaymaz.
 */
export default function VoiceSeatScore({ value = 0 }) {
  const shown = Math.max(1, Math.round(Number(value) || 0));

  return (
    <span
      className="voice-gift-score mt-1 flex w-[56px] items-center justify-center"
      data-score-tier={scoreTier(shown)}
      aria-label={`${shown.toLocaleString('tr-TR')} sayaç`}
    >
      <span className="voice-score-ribbon flex h-[17px] min-w-[28px] items-center justify-center px-1.5">
        <span key={shown} className="number-pop whitespace-nowrap text-[10px] font-bold tabular-nums">
          {formatScore(shown)}
        </span>
      </span>
    </span>
  );
}