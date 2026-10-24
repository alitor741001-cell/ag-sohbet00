import { formatScore } from '@/components/voice/scoreTier';
import useRoomBarArt from '@/components/voice/useRoomBarArt';

/** Oda hediye kutusu: tasarım görseli birebir, değer canlı yazılır; dokununca sıralama açılır. */
export default function GiftScoreChip({ score = 0, onClick }) {
  const art = useRoomBarArt('chip');
  const value = Math.max(0, Math.round(Number(score) || 0));
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative mt-0.5 block w-[46%] transition-transform active:scale-95"
      style={{ aspectRatio: art?.ratio || '391 / 104' }}
      aria-label={`Hediye kutusu: ${formatScore(value)} — sıralamayı gör`}
    >
      {art && <img src={art.src} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none" />}
      <span className="number-pop absolute flex items-center bg-[#060a1f] text-[clamp(12px,3.6vw,17px)] font-semibold tabular-nums text-white" style={{ left: '47%', top: '24%', width: '42%', height: '52%' }}>
        {formatScore(value)}
      </span>
    </button>
  );
}