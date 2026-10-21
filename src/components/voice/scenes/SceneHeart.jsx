import GiftVisual from '@/components/voice/scenes/GiftVisual';

/** Kalp sahnesi: kalp ışıldayarak atar ve zıplar, çevresine küçük kalpler saçılır. */
export default function SceneHeart({ gift }) {
  return (
    <div className="gift-scene gift-scene-heart">
      <div className="gift-scene-heart-halo" />
      <div className="gift-scene-heart-beat">
        <span className="gift-scene-heart-shape" />
        <div className="gift-scene-heart-gift">
          <GiftVisual {...gift} className="h-16 w-16" emojiClassName="text-[46px]" />
        </div>
      </div>
      {[0, 1, 2, 3, 4, 5, 6].map((index) => (
        <span
          key={index}
          className="gift-scene-heart-spark"
          style={{ '--spark-angle': `${index * 51}deg`, animationDelay: `${index * 0.22}s` }}
        />
      ))}
    </div>
  );
}