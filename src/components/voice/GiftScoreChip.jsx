import { Gift } from 'lucide-react';
import { formatScore, scoreTier } from '@/components/voice/scoreTier';

/**
 * Oda hediye kutusu: odada biriken hediye değeri profilin altında durur,
 * hediye geldikçe artar ve dokununca 24 saat / Toplam sıralaması açılır.
 */
export default function GiftScoreChip({ score = 0, onClick }) {
  const value = Math.max(0, Math.round(Number(score) || 0));
  return (
    <button
      type="button"
      onClick={onClick}
      className="voice-gift-score mt-1.5 flex items-center gap-1.5 transition-transform active:scale-95"
      data-score-tier={scoreTier(value)}
      aria-label={`Hediye kutusu: ${formatScore(value)} — sıralamayı gör`}
    >
      <Gift className="h-4 w-4 text-primary" />
      <span className="voice-score-ribbon flex h-[19px] min-w-[34px] items-center justify-center px-2">
        <span className="number-pop whitespace-nowrap text-[11px] font-bold tabular-nums">
          {formatScore(value)}
        </span>
      </span>
    </button>
  );
}