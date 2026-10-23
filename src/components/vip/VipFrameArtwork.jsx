import CosmeticArtwork from '@/components/store/CosmeticArtwork';
import vipFrameArt from '@/lib/vipFrameArt';

// Çerçeve, fotoğrafın tam üstüne oturur; ortasındaki parlaklık profili örtmesin diye
// fotoğrafın denk geldiği daire tamamen şeffaf bırakılır, süsleme sadece kenarda kalır.
const CORE_HOLE = 'radial-gradient(circle at 50% 50%, transparent 0 34.5%, #000 35%)';

export default function VipFrameArtwork({ theme }) {
  const artwork = vipFrameArt(theme?.level, theme?.frame_seed, theme?.frame_level);
  if (!artwork) return null;
  return (
    <span
      aria-hidden="true"
      className="vip-frame-plain pointer-events-none absolute -inset-[22%] z-10"
      style={{
        maskImage: CORE_HOLE,
        WebkitMaskImage: CORE_HOLE,
      }}
    >
      <CosmeticArtwork product={artwork} className="h-full w-full object-contain" draggable={false} />
    </span>
  );
}