import { Image } from '@/components/ui/image';
import VoiceSeatRing from '@/components/voice/VoiceSeatRing';
import SeatCosmeticFrame from '@/components/store/SeatCosmeticFrame';
import { vipVars } from '@/components/vip/vipTheme';
import VipFrameArtwork from '@/components/vip/VipFrameArtwork';
import '@/components/vip/avatarMotion.css';

/** Koltuk portresi: koltuğa özel mücevher çerçeve fotoğrafı çevreler, fotoğraf içini doldurur. */
export default function VoiceSeatPortrait({ seat, className, variant = 0, theme, cosmeticChoice, animated = false }) {
  return (
    <span className={`relative inline-flex ${animated ? 'vip-avatar-active' : ''} ${className}`}>
    <span className="relative block h-full w-full shrink-0 overflow-hidden rounded-full">
      {seat.avatar
        ? <Image src={seat.avatar} alt={seat.name || 'Profil'} unoptimized loading="eager" className="vip-avatar-picture h-full w-full overflow-hidden rounded-full" fittingType="fill" draggable={false} referrerPolicy="no-referrer" />
        : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1d4a7a] to-[#0a1730] text-sm font-bold text-white">{(seat.name || '?')[0]}</span>}
    </span>
    {theme && !cosmeticChoice?.seat_product_id && <span className="pointer-events-none absolute inset-0" style={vipVars(theme)}><VipFrameArtwork theme={theme} /></span>}
    <SeatCosmeticFrame key={`${seat.user_id}:${cosmeticChoice?.seat_product_id || ''}`} seat={seat} choice={cosmeticChoice} />
    </span>
  );
}