import GiftVisual from '@/components/voice/scenes/GiftVisual';

const CLOUDS = [0, 1, 2];

/** Gökyüzü sahnesi: hediye uçağın penceresinde, bulutların arasından süzülerek geçer. */
export default function ScenePlane({ gift }) {
  return (
    <div className="gift-scene gift-scene-plane">
      {CLOUDS.map((index) => (
        <span
          key={index}
          className="gift-scene-cloud"
          style={{ top: `${10 + index * 24}%`, animationDuration: `${6 + index * 2}s`, animationDelay: `${-index * 2.4}s` }}
        />
      ))}
      <div className="gift-scene-vehicle">
        <div className="gift-scene-plane-body" />
        <div className="gift-scene-plane-tail" />
        <div className="gift-scene-plane-wing" />
        <div className="gift-scene-plane-window">
          <GiftVisual {...gift} className="h-7 w-7" emojiClassName="text-[20px]" />
        </div>
      </div>
    </div>
  );
}