import GiftVisual from '@/components/voice/scenes/GiftVisual';

/** Yol sahnesi: hediye arabanın üstünde, farları yanarak gece yolunda hızla geçer. */
export default function SceneCar({ gift }) {
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