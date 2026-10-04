import GiftVisual from '@/components/voice/scenes/GiftVisual';

/** Gökyüzü sahnesi: hediye sıcak hava balonunun sepetinde, yıldızların arasında yükselir. */
export default function SceneBalloon({ gift }) {
  return (
    <div className="gift-scene gift-scene-balloon">
      <div className="gift-scene-stars" />
      <div className="gift-scene-vehicle">
        <div className="gift-scene-balloon-bag" />
        <div className="gift-scene-balloon-basket">
          <GiftVisual {...gift} className="h-9 w-9" emojiClassName="text-[26px]" />
        </div>
      </div>
    </div>
  );
}