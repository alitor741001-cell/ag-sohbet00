import GiftVisual from '@/components/voice/scenes/GiftVisual';

/** Şato sahnesi: şatonun pencereleri ışıldar, hediye kapının önünde parlar. */
export default function SceneCastle({ gift }) {
  return (
    <div className="gift-scene gift-scene-castle">
      <div className="gift-scene-stars" />
      <div className="gift-scene-castle-glow" />
      <div className="gift-scene-castle-base" />
      <span className="gift-scene-castle-window gift-scene-castle-window-left" />
      <span className="gift-scene-castle-window gift-scene-castle-window-right" />
      <div className="gift-scene-castle-gift">
        <GiftVisual {...gift} className="h-16 w-16" emojiClassName="text-[46px]" />
      </div>
    </div>
  );
}