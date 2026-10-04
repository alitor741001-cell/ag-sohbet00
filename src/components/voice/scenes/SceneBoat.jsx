import GiftVisual from '@/components/voice/scenes/GiftVisual';

/** Deniz sahnesi: hediye güvertedeki yelkenliyle dalgaların üstünde soldan sağa yüzer. */
export default function SceneBoat({ gift }) {
  return (
    <div className="gift-scene gift-scene-boat">
      <div className="gift-scene-sea">
        <div className="gift-scene-wave" />
        <div className="gift-scene-wave gift-scene-wave-2" />
      </div>
      <div className="gift-scene-vehicle">
        <div className="gift-scene-wake" />
        <div className="gift-scene-hull" />
        <div className="gift-scene-mast" />
        <div className="gift-scene-sail" />
        <span className="gift-scene-deck-gift">
          <GiftVisual {...gift} className="h-11 w-11" emojiClassName="text-[30px]" />
        </span>
      </div>
    </div>
  );
}