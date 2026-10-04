import { Image } from '@/components/ui/image';
import ProfileFrame from '@/components/ProfileFrame';

/**
 * Büyük hediye duyurusu — bütün sesli odaların ekranında görünür.
 * Üstte hediye gönderenin profili (sol) ve ismi (sağ), ortada hediyenin görseli ve ismi,
 * altta hediye alan kişinin profili ve ismi yer alır. Hediye miktarı gösterilmez.
 */
export default function BigGiftStage({ alert }) {
  if (!alert) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[210] flex items-center justify-center px-5">
      <div
        key={alert.id}
        className="big-gift-life relative w-full max-w-sm overflow-hidden rounded-3xl border border-amber-300/60 bg-black/85 p-4 shadow-[0_0_50px_rgba(239,68,68,0.5)] backdrop-blur-md"
      >
        <span
          className="big-gift-aura pointer-events-none absolute -inset-10 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(250,204,21,0.32), transparent 70%)' }}
        />

        <div className="relative flex items-center justify-between gap-3">
          <ProfileFrame
            avatar={alert.sender_avatar}
            frame={alert.sender_frame}
            frameScale={alert.sender_frame_scale}
            name={alert.sender_name}
            size="sm"
          />
          <div className="min-w-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300/90">Gönderen</p>
            <p className="truncate text-sm font-black text-white">{alert.sender_name || 'Kullanıcı'}</p>
          </div>
        </div>

        <div className="relative my-3 flex flex-col items-center gap-2">
          {alert.gift_image_url ? (
            <Image
              src={alert.gift_image_url}
              alt={alert.gift_name || 'Hediye'}
              className="h-24 w-24"
              fittingType="fit"
              originWidth={192}
              originHeight={192}
            />
          ) : (
            <span className="text-[64px] leading-none drop-shadow-[0_0_18px_rgba(250,204,21,0.85)]">
              {alert.gift_emoji || '🎁'}
            </span>
          )}
          <p className="rounded-2xl border border-amber-300/60 bg-amber-300/10 px-3 py-1 text-sm font-black text-amber-200">
            {alert.gift_name || 'Hediye'}
          </p>
        </div>

        <div className="relative flex items-center gap-3">
          <ProfileFrame
            avatar={alert.recipient_avatar}
            frame={alert.recipient_frame}
            frameScale={alert.recipient_frame_scale}
            name={alert.recipient_name}
            size="sm"
          />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">Alan</p>
            <p className="truncate text-sm font-bold text-white">{alert.recipient_name || 'Kullanıcı'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}