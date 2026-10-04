import { giftById } from '@/lib/gifts';
import VoiceSeatScore from '@/components/voice/VoiceSeatScore';

/** Odaya hediye geldiğinde ekranın ortasında beliren kısa uçan hediye görseli. */
export default function VoiceGiftOverlay({ alert }) {
  if (!alert) return null;
  const gift = giftById(alert.gift);
  return (
    <div className="pointer-events-none absolute inset-0 z-[200] flex flex-col items-center justify-center gap-3 overflow-hidden">
      <span className="gift-pop text-[92px] leading-none drop-shadow-[0_0_28px_rgba(251,191,36,0.7)]">{gift?.emoji || '🎁'}</span>
      <p className="gift-pop rounded-full bg-black/70 px-4 py-1.5 text-xs font-black text-amber-200">
        {alert.name} • {gift?.name || 'Hediye'} • +{gift?.coins || 0}
      </p>
      <VoiceSeatScore value={alert.value || 0} />
    </div>
  );
}