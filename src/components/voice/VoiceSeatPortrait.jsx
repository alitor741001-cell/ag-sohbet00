import { Image } from '@/components/ui/image';
import VoiceSeatRing from '@/components/voice/VoiceSeatRing';

/** Koltuk portresi: desenli altın-turkuaz halka fotoğrafı çevreler, fotoğraf halkanın içini doldurur. */
export default function VoiceSeatPortrait({ seat, className }) {
  return (
    <VoiceSeatRing className={className}>
      {seat.avatar
        ? <Image src={seat.avatar} alt={seat.name || 'Profil'} className="h-full w-full" fittingType="fill" draggable={false} referrerPolicy="no-referrer" />
        : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1d4a7a] to-[#0a1730] text-sm font-bold text-white">{(seat.name || '?')[0]}</span>}
    </VoiceSeatRing>
  );
}