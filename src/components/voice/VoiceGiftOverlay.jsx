import { Image } from '@/components/ui/image';
import VoiceSeatScore from '@/components/voice/VoiceSeatScore';
import { formatK, tierForK, toneColor } from '@/lib/giftTone';

/** Gelen hediyeyi ekranın ortasında kısa süre gösterir; tekli ve toplu gönderimi ayrı anlatır. */
export default function VoiceGiftOverlay({ alert, tiers = [] }) {
  if (!alert) return null;
  const tone = tierForK(tiers, alert.kValue || 0);
  const color = toneColor(tone);
  const bulk = (alert.count || 1) > 1;

  return (
    <div className="pointer-events-none absolute inset-0 z-[200] flex items-center justify-center overflow-hidden px-6">
      <div
        className="gift-pop flex max-w-full flex-col items-center gap-2 rounded-3xl border bg-black/75 px-5 py-4 backdrop-blur"
        style={{ borderColor: color, boxShadow: `0 0 30px ${color}` }}
      >
        {alert.imageUrl ? (
          <Image src={alert.imageUrl} alt={alert.giftName || 'Hediye'} className="h-20 w-20" fittingType="fit" originWidth={160} originHeight={160} />
        ) : (
          <span className="text-[64px] leading-none" style={{ filter: `drop-shadow(0 0 22px ${color})` }}>{alert.emoji || '🎁'}</span>
        )}

        <p className="text-center text-xs font-black" style={{ color }}>
          {bulk
            ? `🎁 ${alert.giftName} gönderildi – ${alert.count} kişiye`
            : `${alert.senderName || 'Hediye'} → ${alert.recipientName || 'Oda'}`}
        </p>

        {bulk ? (
          <p className="text-[11px] font-bold text-white/80">Toplam {formatK(alert.totalK || 0)}</p>
        ) : (
          <p className="text-[11px] font-bold text-white/80">{alert.giftName || 'Hediye'} • +{formatK(alert.kValue || 0)}</p>
        )}

        {!bulk && <VoiceSeatScore value={alert.value || 0} />}
      </div>
    </div>
  );
}