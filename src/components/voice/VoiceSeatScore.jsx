import '@/components/voice/seatScore.css';
import { formatSeatScore, scoreTier } from '@/components/voice/scoreTier';

/**
 * Koltuk altı ileri sayaç: 1'den başlar, hediye geldikçe artar.
 * Profilin altında şerit rozet içinde gösterilir; rakamlar beyaz,
 * yalnızca rozetin rengi hediye seviyesine göre değişir.
 * Her hücre aynı genişlikte kaldığı için koltuk ızgarası kaymaz.
 */
// Şerit genişliği koltuk boyutuna göre: koltuk ne kadar küçükse şerit de o kadar dar kalır.
const WIDTH = { xs: 'w-[42px]', sm: 'w-[52px]', md: 'w-[68px]', lg: 'w-[88px]', xl: 'w-[96px]' };

// Yazı boyu da koltukla küçülür ki rakam şeridin dışına taşmasın.
const TEXT = { xs: 'h-[14px] text-[8px]', sm: 'h-[15px] text-[9px]', md: 'h-[17px] text-[10px]', lg: 'h-[19px] text-[11px]', xl: 'h-[20px] text-[12px]' };

export default function VoiceSeatScore({ value = 0, size = 'md' }) {
  const shown = Math.max(0, Math.round(Number(value) || 0));

  return (
    <span
      className={`voice-gift-score relative z-20 -mt-2 mb-0.5 flex shrink-0 ${WIDTH[size] || WIDTH.md} items-center justify-center`}
      data-score-tier={scoreTier(shown)}
      aria-label={`${shown.toLocaleString('tr-TR')} sayaç`}
    >
      <span className={`voice-score-ribbon flex w-full max-w-full items-center justify-center px-0.5 ${TEXT[size] || TEXT.md}`}>
        <span key={shown} className="number-pop shrink-0 whitespace-nowrap font-extrabold tabular-nums tracking-tight leading-none">
          {formatSeatScore(shown)}
        </span>
      </span>
    </span>
  );
}