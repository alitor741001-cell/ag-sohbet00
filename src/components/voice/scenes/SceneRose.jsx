import GiftVisual from '@/components/voice/scenes/GiftVisual';

/** Gül sahnesi: gül kendi ekseninde döner, taç yaprakları aşağı süzülür. */
export default function SceneRose({ gift }) {
  return (
    <div className="gift-scene gift-scene-rose">
      <div className="gift-scene-rose-glow" />
      <div className="gift-scene-rose-spin">
        <GiftVisual {...gift} className="h-28 w-28" emojiClassName="text-[76px]" />
      </div>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
        <span
          key={index}
          className="gift-scene-petal"
          style={{ left: `${6 + index * 12}%`, animationDelay: `${index * 0.31}s` }}
        />
      ))}
    </div>
  );
}