import { Image } from '@/components/ui/image';
import VoiceSeatScore from '@/components/voice/VoiceSeatScore';
import { formatK, tierForK, toneColor } from '@/lib/giftTone';

/** Gönderilen hediyeyi üstte kompakt bir pop-up ile gösterir: görseli ve ismi öne çıkar, ekranı kaplamaz. */
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
    <div className="pointer-events-none absolute inset-x-0 top-[max(3.75rem,calc(env(safe-area-inset-top)+3rem))] z-[200] flex justify-center px-4">
      <div
        key={`${alert.key}-${repeat}`}
        className="gift-pop flex max-w-[92%] items-center gap-2.5 rounded-2xl border bg-black/80 px-3 py-2 backdrop-blur-md"
        style={{ borderColor: color, boxShadow: `0 0 22px ${color}` }}
      >
        {alert.imageUrl ? (
          <Image
            src={alert.imageUrl}
            alt={alert.giftName || 'Hediye'}
            className="h-11 w-11 shrink-0"
            fittingType="fit"
            originWidth={96}
            originHeight={96}
          />
        ) : (
          <span className="shrink-0 text-[34px] leading-none" style={{ filter: `drop-shadow(0 0 14px ${color})` }}>
            {alert.emoji || '🎁'}
          </span>
        )}

        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-[13px] font-black" style={{ color }}>
            {alert.giftName || 'Hediye'}
            {repeat > 1 && (
              <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-black text-white">×{repeat}</span>
            )}
          </p>
          <p className="truncate text-[10px] font-semibold text-white/75">{meta}</p>
        </div>

        {!bulk && alert.value ? <VoiceSeatScore value={alert.value} /> : null}
      </div>
    </div>
  );
}