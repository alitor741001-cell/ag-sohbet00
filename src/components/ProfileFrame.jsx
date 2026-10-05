import { Image } from '@/components/ui/image';

// Çerçeve sistemi kaldırıldı: fotoğraf her yerde çerçevesiz, yuvarlak gösterilir.
const SIZES = {
  '3xs': 'h-7 w-7 text-[9px]',
  '2xs': 'h-9 w-9 text-[10px]',
  xs: 'h-8 w-8 text-[10px]',
  sm: 'h-12 w-12 text-xs',
  md: 'h-16 w-16 text-sm',
  lg: 'h-40 w-40 text-3xl',
  xl: 'h-24 w-24 text-2xl',
};

/** Profil fotoğrafı: tüm uygulamada çerçevesiz gösterim. */
export default function ProfileFrame({ avatar, name, size = 'md', className = '', children }) {
  const dims = SIZES[size] || SIZES.md;
  return children || (
    <div className={`relative shrink-0 overflow-hidden rounded-full ${dims} ${className}`}>
      {avatar
        ? <Image src={avatar} alt={name || 'Profil'} fittingType="fill" className="h-full w-full" draggable={false} referrerPolicy="no-referrer" />
        : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-accent font-bold text-white">{(name || '?')[0]}</span>}
    </div>
  );
}