import { Image } from '@/components/ui/image';
import usePreparedPortrait from '@/components/xp/usePreparedPortrait';
import PortraitPhoto from '@/components/profile/PortraitPhoto';

const SIZES = {
  '2xs': 'h-9 w-9 text-[10px]',
  xs: 'h-14 w-14 text-[10px]',
  sm: 'h-20 w-20 text-xs',
  md: 'h-28 w-28 text-sm',
  lg: 'h-64 w-64 text-3xl',
};

// Photo and artwork share the exact, pixel-derived opening in every view.
export default function FramedPortrait({ info, avatar, name, size = 'md', className = '', scale = 100, panX = 0, panY = 0 }) {
  const portrait = usePreparedPortrait(info.image_url, info.opening);
  return <div className={`relative isolate shrink-0 ${SIZES[size] || SIZES.md} ${className}`} aria-busy={!portrait}>
    <PortraitPhoto portrait={portrait} avatar={avatar} name={name} scale={scale} panX={panX} panY={panY} />
    {portrait && <Image src={portrait.src} alt="" aria-hidden="true" loading="eager" fittingType="fit" className="pointer-events-none absolute inset-0 z-[1] h-full w-full" />}
  </div>;
}