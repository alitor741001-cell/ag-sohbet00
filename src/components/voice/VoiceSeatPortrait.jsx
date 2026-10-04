import { Image } from '@/components/ui/image';
import { useFrameCatalog } from '@/lib/FrameCatalogContext';
import usePreparedPortrait from '@/components/xp/usePreparedPortrait';
import TransparentFrameImage from '@/components/xp/TransparentFrameImage';

/** Koltuk portresi: fotoğraf daima koltuk çemberini doldurur. */
export default function VoiceSeatPortrait({ seat, className }) {
  const { frames } = useFrameCatalog();
  const info = frames[seat.frame];
  const portrait = usePreparedPortrait(info?.prepared ? info.image_url : null, info?.opening);
  const bounds = portrait?.bounds;
  const artworkStyle = bounds ? {
    width: `${84 / bounds[2]}%`, height: `${84 / bounds[3]}%`,
    left: `${8 - bounds[0] * 84 / bounds[2]}%`, top: `${8 - bounds[1] * 84 / bounds[3]}%`,
  } : { inset: '-34%' };
  return <span className={`relative block overflow-hidden rounded-full border border-border ${className}`}>
    {seat.avatar
      ? <Image src={seat.avatar} alt={seat.name || 'Profil'} className="h-full w-full" fittingType="fill" draggable={false} referrerPolicy="no-referrer" />
      : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground">{(seat.name || '?')[0]}</span>}
    {info?.image_url && <span className="pointer-events-none absolute" style={artworkStyle}>
      {portrait
        ? <Image src={portrait.src} alt="" fittingType="fit" className="h-full w-full" />
        : <TransparentFrameImage src={info.image_url} crop={info.sprite} animated={false} />}
    </span>}
  </span>;
}