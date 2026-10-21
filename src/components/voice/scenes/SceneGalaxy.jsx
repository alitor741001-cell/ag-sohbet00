import GiftVisual from '@/components/voice/scenes/GiftVisual';

/** Galaksi sahnesi: yörünge halkaları döner, hediye merkezde parlar. */
export default function SceneGalaxy({ gift }) {
  return (
    <div className="gift-scene gift-scene-galaxy">
      <div className="gift-scene-stars" />
      <div className="gift-scene-galaxy-core" />
      {[220, 310, 400].map((size, index) => (
        <span
          key={size}
          className="gift-scene-galaxy-ring"
          style={{ width: `${size}px`, height: `${size}px`, animationDuration: `${5 + index * 2.2}s`, animationDirection: index % 2 ? 'reverse' : 'normal' }}
        />
      ))}
      <div className="gift-scene-galaxy-gift">
        <GiftVisual {...gift} className="h-20 w-20" emojiClassName="text-[56px]" />
      </div>
    </div>
  );
}