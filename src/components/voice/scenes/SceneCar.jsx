import { Image } from '@/components/ui/image';
import GiftVisual from '@/components/voice/scenes/GiftVisual';

// Spor araba görselinin siyah zemini alfaya çevrildi: araba kutunun içinde değil,
// gerçekten yolda gidiyor gibi görünür (bkz. public/gifts/spor-araba.png).
const CAR_CUTOUT = '/gifts/spor-araba.png';

/** Yol sahnesi: hediye arabanın üstünde, farları yanarak gece yolunda hızla geçer. */
export default function SceneCar({ gift }) {
  // Görselli hediyede arabanın kendisi yola çıkar; zemin şeffaf olduğu için kare iz kalmaz,
  // asfalt üstündeki far ışığı ve silueti izleyen ışıltı aracı yola oturtur.
  if (gift?.imageUrl) {
    return (
      <div className="gift-scene gift-scene-car">
        <div className="gift-scene-stars" />
        <div className="gift-scene-road">
          <div className="gift-scene-road-line" />
        </div>
        <div className="gift-scene-vehicle gift-scene-car-photo">
          <span className="gift-scene-car-glow" />
          <span className="gift-scene-car-roadlight" />
          <Image
            src={CAR_CUTOUT}
            alt={gift.name || 'Spor araba'}
            className="gift-scene-car-photo-img"
            fittingType="fit"
            originWidth={640}
            originHeight={320}
          />
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