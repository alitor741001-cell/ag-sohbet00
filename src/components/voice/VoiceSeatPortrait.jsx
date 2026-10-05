import { Image } from '@/components/ui/image';

/** Koltuk portresi: fotoğraf daima koltuk çemberini doldurur (çerçevesiz). */
export default function VoiceSeatPortrait({ seat, className }) {
  return <span className={`relative block overflow-hidden rounded-full border border-border ${className}`}>
    {seat.avatar
      ? <Image src={seat.avatar} alt={seat.name || 'Profil'} className="h-full w-full" fittingType="fill" draggable={false} referrerPolicy="no-referrer" />
      : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">{(seat.name || '?')[0]}</span>}
  </span>;
}