import { Gem, Gift } from 'lucide-react';
import { formatScore } from '@/components/voice/scoreTier';
import '@/components/voice/voiceNeonBars.css';

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
      className="neon-panel neon-glow mt-1.5 flex items-center gap-2 py-1 pl-2 pr-3 transition-transform active:scale-95"
      aria-label={`Hediye kutusu: ${formatScore(value)} — sıralamayı gör`}
    >
      <Gift className="h-5 w-5 text-fuchsia-400 drop-shadow-[0_0_4px_#e879f9]" />
      <Gem className="h-5 w-5 text-cyan-300 drop-shadow-[0_0_4px_#67e8f9]" />
      <span className="number-pop whitespace-nowrap text-sm font-bold tabular-nums text-white">{formatScore(value)}</span>
    </button>
  );
}