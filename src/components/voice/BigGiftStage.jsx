import { Image } from '@/components/ui/image';
import BigGiftPair from '@/components/voice/BigGiftPair';
import GiftVideoStage from '@/components/voice/GiftVideoStage';
import { giftVideoFor } from '@/lib/giftClips';

/**
 * Büyük hediye duyurusu (1M ve üzeri) — bütün sesli odaların ekranında görünür.
 * Üstte gönderen ve alan profil/isimleri yan yana, altında hareketli hediye görseli durur.
 * Hediye görselinin kendi siyah zemini blend ile kaybolur; kutu arkası hediye gibi kalmaz.
 */
export default function BigGiftStage({ alert, gifts = [] }) {
  if (!alert) return null;
  const video = giftVideoFor(gifts.find((gift) => gift.id === alert.gift_id));
  if (video) return (
    <div key={alert.id} className="pointer-events-none absolute inset-0 z-[210] mix-blend-screen">
      <GiftVideoStage src={video} />
      <div className="absolute inset-x-0 bottom-[16%] px-5"><BigGiftPair alert={alert} /><p className="mt-2 text-center text-sm font-bold text-fantasy-gold">{alert.gift_name}</p></div>
    </div>
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-[210] flex items-center justify-center px-5">
      <div
        key={alert.id}
        className="big-gift-life relative w-full max-w-xs bg-transparent px-4 pb-4 pt-3.5"
      >

        <BigGiftPair alert={alert} />

        <div className="relative mt-3 flex flex-col items-center">
          {alert.gift_image_url ? (
            <Image
              src={alert.gift_image_url}
              alt={alert.gift_name || 'Hediye'}
              className="big-gift-float h-28 w-28 opacity-30 mix-blend-screen"
              fittingType="fit"
              originWidth={192}
              originHeight={192}
            />
          ) : (
            <span className="big-gift-float text-[68px] leading-none opacity-30">{alert.gift_emoji || '🎁'}</span>
          )}
          <p className="mt-1 rounded-2xl border border-amber-300/60 bg-amber-300/10 px-3 py-1 text-sm font-black text-amber-200">
            {alert.gift_name || 'Hediye'}
          </p>
        </div>
      </div>
    </div>
  );
}