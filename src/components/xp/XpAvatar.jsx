import XpFrameArtwork from '@/components/xp/XpFrameArtwork';
import { frameStyle } from '@/lib/xp';

const SIZES = { '3xs': 'h-7 w-7 text-[9px]', '2xs': 'h-9 w-9 text-[10px]', xs: 'h-10 w-10 text-[10px]', sm: 'h-12 w-12 text-xs', md: 'h-16 w-16 text-sm', lg: 'h-28 w-28 text-3xl', xl: 'h-24 w-24 text-2xl' };

export default function XpAvatar({ avatar, name, frame, size = 'sm', className = '' }) {
  const portrait = avatar ? <img src={avatar} alt={name || 'Profil fotoğrafı'} className="h-full w-full object-cover object-center" referrerPolicy="no-referrer" draggable={false} />
    : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-accent font-bold text-primary-foreground">{(name || '?')[0]}</span>;
  if (!frame) return <div className={`relative shrink-0 overflow-hidden rounded-full ${SIZES[size] || SIZES.sm} ${className}`}>{portrait}</div>;
  const style = frameStyle(frame);
  return <div className={`relative shrink-0 overflow-visible ${SIZES[size] || SIZES.sm} ${className}`}>
    <div className="absolute inset-[18%] overflow-hidden rounded-full">{portrait}</div>
    <div className="pointer-events-none absolute inset-0 z-10"><XpFrameArtwork type={frame.style} colors={style.colors} glow={style.glow} animated={frame.animated} imageUrl={frame.image_url} /></div>
  </div>;
}