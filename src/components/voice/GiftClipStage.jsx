import { Image } from '@/components/ui/image';
import '@/styles/giftClip.css';

/**
 * Hediye gönderiminde oynayan sinematik klip: gerçek görüntü kareleri
 * yumuşak geçiş, yaklaşan kamera, ışık şeridi ve film greniyle video gibi akar.
 */
export default function GiftClipStage({ frames = [], color = '#facc15' }) {
  if (!frames.length) return null;

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
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

      {/* Objektif ışığı, film greni ve kenar karartması */}
      <div className="pointer-events-none absolute inset-0 gift-clip-sweep opacity-60" />
      <div className="pointer-events-none absolute inset-0 gift-clip-grain opacity-[0.10] mix-blend-screen" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 48%, transparent 34%, ${color}22 62%, rgba(0,0,0,0.78) 100%)` }}
      />
      <div className="pointer-events-none absolute inset-0 gift-clip-flash" />

      {/* Sinematik üst/alt şerit */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[6vh] bg-gradient-to-b from-black/85 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[16vh] bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
    </div>
  );
}