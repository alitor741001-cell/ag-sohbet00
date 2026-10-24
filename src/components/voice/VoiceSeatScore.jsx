import { formatScore, scoreTier } from '@/components/voice/scoreTier';

/**
 * Koltuk altı ileri sayaç: 1'den başlar, hediye geldikçe artar.
 * Profilin altında şerit rozet içinde gösterilir; rakamlar beyaz,
 * yalnızca rozetin rengi hediye seviyesine göre değişir.
 * Her hücre aynı genişlikte kaldığı için koltuk ızgarası kaymaz.
 */
// Şerit genişliği koltuk boyutuna göre: koltuk ne kadar küçükse şerit de o kadar dar kalır.
const WIDTH = { xs: 'w-[42px]', sm: 'w-[52px]', md: 'w-[68px]', lg: 'w-[88px]', xl: 'w-[96px]' };

export default function VoiceSeatScore({ value = 0, size = 'md' }) {
  const shown = Math.max(0, Math.round(Number(value) || 0));

  return (
    <span
      className={`voice-gift-score mt-1 flex ${WIDTH[size] || WIDTH.md} items-center justify-center`}
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