import { Image } from '@/components/ui/image';

/** Koltuk portresi: altın-turkuaz halka fotoğrafı çevreler, fotoğraf halkanın içini doldurur. */
export default function VoiceSeatPortrait({ seat, className }) {
  return (
    <span
      className={`relative block rounded-full p-[2px] ${className}`}
      style={{
        background: 'conic-gradient(from 200deg, #ffe9b8 0%, #6cd4d6 32%, #1e3a5f 58%, #e8c47c 82%, #ffe9b8 100%)',
        boxShadow: '0 3px 10px -4px rgba(0,0,0,0.85), 0 0 10px -4px rgba(108,212,214,0.65)',
      }}
    >
      <span className="block h-full w-full overflow-hidden rounded-full bg-[#08101d]" style={{ boxShadow: 'inset 0 0 0 1px rgba(6,12,22,0.9)' }}>
        {seat.avatar
          ? <Image src={seat.avatar} alt={seat.name || 'Profil'} className="h-full w-full" fittingType="fill" draggable={false} referrerPolicy="no-referrer" />
          : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1d4a7a] to-[#0a1730] text-sm font-bold text-white">{(seat.name || '?')[0]}</span>}
      </span>
    </span>
  );
}