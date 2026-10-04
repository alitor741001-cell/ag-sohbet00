import { Image } from '@/components/ui/image';
import BigGiftPair from '@/components/voice/BigGiftPair';

/**
 * Büyük hediye duyurusu (1M ve üzeri) — bütün sesli odaların ekranında görünür.
 * Üstte gönderen ve alan profil/isimleri yan yana, altında hareketli hediye görseli durur.
 * Hediye görselinin kendi siyah zemini blend ile kaybolur; kutu arkası hediye gibi kalmaz.
 */
export default function BigGiftStage({ alert }) {
  if (!alert) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[210] flex items-center justify-center px-5">
      <div
        key={alert.id}
        className="big-gift-life relative w-full max-w-sm overflow-hidden rounded-3xl border border-amber-300/60 bg-gradient-to-b from-[#2b1526]/90 via-[#170a12]/90 to-black/80 px-4 pb-4 pt-3.5 shadow-[0_0_50px_rgba(239,68,68,0.5)] backdrop-blur-md"
      >
        <span
          className="big-gift-aura pointer-events-none absolute -inset-10 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(250,204,21,0.32), transparent 70%)' }}
        />

        <BigGiftPair alert={alert} />

        <div className="relative mt-3 flex flex-col items-center">
          {alert.gift_image_url ? (
            <Image
              src={alert.gift_image_url}
              alt={alert.gift_name || 'Hediye'}
              className="big-gift-float h-28 w-28 mix-blend-screen"
              fittingType="fit"
              originWidth={192}
              originHeight={192}
            />
          ) : (
            <span className="big-gift-float text-[68px] leading-none">{alert.gift_emoji || '🎁'}</span>
          )}
          <p className="mt-1 rounded-2xl border border-amber-300/60 bg-amber-300/10 px-3 py-1 text-sm font-black text-amber-200">
            {alert.gift_name || 'Hediye'}
          </p>
        </div>
      </div>
    </div>
  );
}