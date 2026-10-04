import { Image } from '@/components/ui/image';
import VoiceSeatScore from '@/components/voice/VoiceSeatScore';
import { formatK, tierForK, toneColor } from '@/lib/giftTone';

/**
 * Gönderilen hediye odadaki herkese kısa süreli bir animasyonla gösterilir:
 * hediyenin görseli (yoksa emojisi) ışıltıyla belirir, ismi ve gönderen → alan bilgisi altta durur.
 * Seri gönderimlerde yeni pencere açılmaz, sayaç (×2, ×3) artar.
 */
export default function VoiceGiftOverlay({ alert, tiers = [] }) {
  if (!alert) return null;
  const tone = tierForK(tiers, alert.kValue || 0);
  const color = toneColor(tone);
  const repeat = Number(alert.repeat) || 1;
  const people = Number(alert.count) || 1;
  const bulk = people > 1;
  const meta = bulk
    ? `${people} kişiye${alert.totalK ? ` • ${formatK(alert.totalK)}` : ''}`
    : `${alert.senderName ? `${alert.senderName} → ` : ''}${alert.recipientName || 'Oda'}${alert.kValue ? ` • +${formatK(alert.kValue)}` : ''}`;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[42%] z-[200] flex -translate-y-1/2 justify-center px-6">
      <div key={`${alert.key}-${repeat}`} className="gift-burst flex flex-col items-center gap-2">
        <div className="relative flex items-center justify-center">
          <span
            className="gift-aura absolute h-32 w-32 rounded-full"
            style={{ background: `radial-gradient(circle, ${color}66, transparent 70%)` }}
          />
          {alert.imageUrl ? (
            <Image
              src={alert.imageUrl}
              alt={alert.giftName || 'Hediye'}
              className="relative h-24 w-24"
              fittingType="fit"
              originWidth={192}
              originHeight={192}
            />
          ) : (
            <span className="relative text-[68px] leading-none" style={{ filter: `drop-shadow(0 0 18px ${color})` }}>
              {alert.emoji || '🎁'}
            </span>
          )}
        </div>

        <div
          className="flex items-center gap-2 rounded-2xl border bg-black/75 px-3 py-1.5 backdrop-blur-md"
          style={{ borderColor: color, boxShadow: `0 0 20px ${color}88` }}
        >
          <p className="text-sm font-black" style={{ color }}>
            {alert.giftName || 'Hediye'}
          </p>
          {repeat > 1 && (
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[11px] font-black text-white">×{repeat}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <p className="max-w-[80vw] truncate rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white/85">{meta}</p>
          {!bulk && alert.value ? <VoiceSeatScore value={alert.value} /> : null}
        </div>
      </div>
    </div>
  );
}