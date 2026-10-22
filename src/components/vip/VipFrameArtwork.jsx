import CosmeticArtwork from '@/components/store/CosmeticArtwork';
import vipFrameArt from '@/lib/vipFrameArt';
export default function VipFrameArtwork({ theme }) {
  const artwork = vipFrameArt(theme?.level, theme?.frame_seed, theme?.frame_level);
  return artwork ? <span aria-hidden="true" className="pointer-events-none absolute -inset-[12.5%] z-10" style={{ filter: 'drop-shadow(0 0 6px var(--vip-accent))' }}><CosmeticArtwork product={artwork} className="h-full w-full object-contain" draggable={false} /></span> : null;
}