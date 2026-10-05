import { useState } from 'react';
import { useFrameCatalog } from '@/lib/FrameCatalogContext';
import TransparentFrameImage from '@/components/xp/TransparentFrameImage';
import FramedPortrait from '@/components/profile/FramedPortrait';

const SIZES = {
  '3xs': { avatar: 'h-7 w-7 text-[9px]', sprite: 'h-12 w-12' },
  '2xs': { avatar: 'h-9 w-9 text-[10px]', sprite: 'h-16 w-16' },
  xs: { avatar: 'h-8 w-8 text-[10px]', sprite: 'h-16 w-16' },
  sm: { avatar: 'h-12 w-12 text-xs', sprite: 'h-24 w-24' },
  md: { avatar: 'h-16 w-16 text-sm', sprite: 'h-32 w-28' },
  lg: { avatar: 'h-40 w-40 text-3xl', sprite: 'h-72 w-64' },
};

export default function ProfileFrame({ frame, children, size = 'md', className = '', avatar, name, frameScale = 100, panX = 0, panY = 0 }) {
  const [frameMetrics, setFrameMetrics] = useState(null);
  const { frames } = useFrameCatalog();
  const frameInfo = frames[frame];
  const dims = SIZES[size] || SIZES.md;
  if (frameInfo?.prepared) return <FramedPortrait info={frameInfo} avatar={avatar} name={name} size={size} className={className} scale={frameScale} panX={panX} panY={panY} />;
  if (!frame || !frameInfo?.image_url) return children || (
    <div className={`relative shrink-0 overflow-hidden rounded-full ${dims.avatar} ${className}`}>
      {avatar
        ? <img src={avatar} alt={name || 'Profil'} className="h-full w-full object-cover object-center" referrerPolicy="no-referrer" draggable={false} />
        : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-accent font-bold text-white">{(name || '?')[0]}</span>}
    </div>
  );
  const artworkClass = frameInfo.sprite
    ? 'h-[240%] w-[168%] -translate-x-1/2 -translate-y-[42%]'
    : 'h-[168%] w-[168%] -translate-x-1/2 -translate-y-1/2';
  const avatarScale = (frameMetrics?.avatarScale || 1) * (Math.min(180, Math.max(80, Number(frameScale) || 100)) / 100);
  const px = Math.max(-100, Math.min(100, Number(panX) || 0));
  const py = Math.max(-100, Math.min(100, Number(panY) || 0));

  return (
    <div className={`relative shrink-0 overflow-visible ${frameInfo.sprite ? dims.sprite : dims.avatar} ${className}`} title={frameInfo.label}>
      <div className={`relative mx-auto ${dims.avatar}`}>
        <div className="absolute inset-0 overflow-hidden rounded-full" style={{ transform: `scale(${avatarScale}) translate(${px}%, ${py}%)` }}>
          {avatar
            ? <img src={avatar} alt={name || 'Profil'} className="h-full w-full object-cover object-center" referrerPolicy="no-referrer" draggable={false} />
            : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-accent font-bold text-white">{(name || '?')[0]}</span>}
        </div>
        <div className={`pointer-events-none absolute left-1/2 top-1/2 z-[2] max-w-none overflow-visible ${artworkClass}`}>
          <TransparentFrameImage src={frameInfo.image_url} crop={frameInfo.sprite} animated={false} onMetrics={setFrameMetrics} />
        </div>
      </div>
    </div>
  );
}