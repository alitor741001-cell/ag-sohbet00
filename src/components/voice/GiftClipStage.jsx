import { Image } from '@/components/ui/image';
import '@/styles/giftClip.css';

/**
 * Hediye gönderiminde oynayan sinematik klip: gerçek görüntü kareleri
 * yumuşak geçiş, yaklaşan kamera, ışık şeridi ve film greniyle video gibi akar.
 */
export default function GiftClipStage({ frames = [], color = '#facc15' }) {
  if (!frames.length) return null;

  return (
    <div className="absolute inset-0 overflow-hidden bg-transparent opacity-30">
      <div className="absolute inset-0 gift-clip-hero">
        <Image
          src={frames[0]}
          alt=""
          fittingType="fill"
          className="h-full w-full object-cover"
        />
      </div>

      {frames[1] && (
        <div className="absolute inset-0 gift-clip-shot">
          <Image
            src={frames[1]}
            alt=""
            fittingType="fill"
            className="h-full w-full object-cover"
          />
        </div>
      )}


    </div>
  );
}