import { Image } from '@/components/ui/image';
import '@/components/vip/avatarMotion.css';

const SIZES = { '3xs': 'h-7 w-7 text-[9px]', '2xs': 'h-9 w-9 text-[10px]', xs: 'h-10 w-10 text-[10px]', sm: 'h-12 w-12 text-xs', md: 'h-16 w-16 text-sm', lg: 'h-28 w-28 text-3xl', xl: 'h-24 w-24 text-2xl' };

/** Profil fotoğrafı: XP çerçeveleri kaldırıldı, yalnızca fotoğraf gösterilir. */
export default function XpAvatar({ avatar, name, size = 'sm', className = '', animated = false }) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-full ${SIZES[size] || SIZES.sm} ${animated ? 'vip-avatar-active' : ''} ${className}`}>
      {avatar
        ? <Image src={avatar} alt={name || 'Profil fotoğrafı'} fittingType="fill" className="vip-avatar-picture h-full w-full" draggable={false} referrerPolicy="no-referrer" />
        : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-accent font-bold text-white">{(name || '?')[0]}</span>}
    </div>
  );
}