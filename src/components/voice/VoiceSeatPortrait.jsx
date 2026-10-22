import { Image } from '@/components/ui/image';
import VoiceSeatRing from '@/components/voice/VoiceSeatRing';
import { vipVars } from '@/components/vip/vipTheme';

/** Koltuk portresi: koltuğa özel mücevher çerçeve fotoğrafı çevreler, fotoğraf içini doldurur. */
export default function VoiceSeatPortrait({ seat, className, variant = 0, theme }) {
  return (
    <span className={`relative inline-flex ${className}`}>
    <VoiceSeatRing className="h-full w-full" variant={variant}>
      {seat.avatar
        ? <Image src={seat.avatar} alt={seat.name || 'Profil'} className="h-full w-full" fittingType="fill" draggable={false} referrerPolicy="no-referrer" />
        : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1d4a7a] to-[#0a1730] text-sm font-bold text-white">{(seat.name || '?')[0]}</span>}
    </VoiceSeatRing>
    {theme && <span className="vip-avatar-frame pointer-events-none absolute inset-0" data-vip-shape={theme.shape} style={vipVars(theme)} />}
    </span>
  );
}