import GiftVisual from '@/components/voice/scenes/GiftVisual';

const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

/** Havai fişek sahnesi: hediye ortada parlar, çevresinde ışık patlamaları yayılır. */
export default function SceneFireworks({ gift }) {
  return (
    <div className="gift-scene gift-scene-fireworks">
      <div className="gift-scene-stars" />
      <div className="gift-scene-rays" />
      {ANGLES.map((angle, index) => (
        <span
          key={angle}
          className="gift-scene-burst"
          style={{ '--scene-angle': `${angle}deg`, animationDelay: `${index * 0.12}s` }}
        />
      ))}
      <div className="gift-scene-fireworks-gift">
        <GiftVisual {...gift} className="h-24 w-24" emojiClassName="text-[64px]" />
      </div>
    </div>
  );
}