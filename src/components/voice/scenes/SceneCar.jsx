import { Image } from '@/components/ui/image';
import GiftVisual from '@/components/voice/scenes/GiftVisual';

/** Yol sahnesi: hediye arabanın üstünde, farları yanarak gece yolunda hızla geçer. */
export default function SceneCar({ gift }) {
  // Araba görseli olan hediyede resim doğrudan araç olur: farları yanar, gövdesi yolda titrer,
  // hız çizgileri ardında akar — hediye durağan resim gibi değil, geçen bir araba gibi görünür.
  if (gift?.imageUrl) {
    return (
      <div className="gift-scene gift-scene-car">
        <div className="gift-scene-stars" />
        <div className="gift-scene-road">
          <div className="gift-scene-road-line" />
        </div>
        <div className="gift-scene-vehicle gift-scene-car-photo">
          <span className="gift-scene-car-photo-img">
            <Image
              src={gift.imageUrl}
              alt={gift.name || 'Spor araba'}
              className="h-full w-full"
              fittingType="fit"
              originWidth={1774}
              originHeight={887}
            />
          </span>
          <span className="gift-scene-car-streaks" />
          <div className="gift-scene-car-beam" />
        </div>
      </div>
    );
  }

  return (
    <div className="gift-scene gift-scene-car">
      <div className="gift-scene-stars" />
      <div className="gift-scene-road">
        <div className="gift-scene-road-line" />
      </div>
      <div className="gift-scene-vehicle">
        <span className="gift-scene-car-cargo">
          <GiftVisual {...gift} className="h-10 w-10" emojiClassName="text-[28px]" />
        </span>
        <div className="gift-scene-car-roof" />
        <div className="gift-scene-car-glass" />
        <div className="gift-scene-car-body" />
        <span className="gift-scene-car-wheel gift-scene-car-wheel-back" />
        <span className="gift-scene-car-wheel gift-scene-car-wheel-front" />
        <div className="gift-scene-car-beam" />
      </div>
    </div>
  );
}