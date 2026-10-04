import GiftVisual from '@/components/voice/scenes/GiftVisual';

/** Uzay sahnesi: hediye roketin penceresinde, roket alev püskürterek yıldızların arasından yükselir. */
export default function SceneRocket({ gift }) {
  return (
    <div className="gift-scene gift-scene-rocket">
      <div className="gift-scene-stars" />
      <div className="gift-scene-vehicle">
        <div className="gift-scene-flame" />
        <div className="gift-scene-rocket-body" />
        <span className="gift-scene-rocket-fin gift-scene-rocket-fin-left" />
        <span className="gift-scene-rocket-fin gift-scene-rocket-fin-right" />
        <div className="gift-scene-rocket-window">
          <GiftVisual {...gift} className="h-8 w-8" emojiClassName="text-[22px]" />
        </div>
      </div>
    </div>
  );
}