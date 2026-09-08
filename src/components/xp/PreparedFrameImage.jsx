import { Image } from '@/components/ui/image';
import usePreparedPortrait from '@/components/xp/usePreparedPortrait';

// Never display an unprocessed image over the portrait, even during loading.
export default function PreparedFrameImage({ src, opening, className = '' }) {
  const portrait = usePreparedPortrait(src, opening);
  if (!portrait) return null;
  return <Image src={portrait.src} alt="" aria-hidden="true" loading="eager" fittingType="fit" className={`pointer-events-none h-full w-full ${className}`} />;
}