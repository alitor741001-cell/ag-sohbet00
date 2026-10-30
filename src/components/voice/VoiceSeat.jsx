import { memo } from 'react';
import { Armchair, Crown, Hourglass, Lock, MicOff, Shield } from 'lucide-react';
import { seatNeon } from '@/components/voice/VoiceSeatRing';
import shallowEqual from '@/components/data/shallowEqual';
import VoiceSeatPortrait from '@/components/voice/VoiceSeatPortrait';
import VoiceSeatRing from '@/components/voice/VoiceSeatRing';
import { isHiddenName } from '@/lib/hiddenUser';
import VoiceSpeakingWave from '@/components/voice/VoiceSpeakingWave';
import { vipLook } from '@/components/vip/vipTheme';
import SeatArt from '@/components/voice/SeatArt';
import VoiceSeatScore from '@/components/voice/VoiceSeatScore';
import VoiceSeatName from '@/components/voice/VoiceSeatName';

// Her koltuk aynı boyutta sabit bir portre alanı kullanır: profil boyutu değişse de
// ızgara kaymaz, çerçeveler komşu koltuğa taşmaz.
const CELL = { xs: 'h-[42px] w-[42px]', sm: 'h-[52px] w-[52px]', md: 'h-[68px] w-[68px]', lg: 'h-[88px] w-[88px]', xl: 'h-[96px] w-[96px]' };
const FACE = { xs: 'h-10 w-10', sm: 'h-12 w-12', md: 'h-14 w-14', lg: 'h-20 w-20', xl: 'h-[88px] w-[88px]' };
const RING = { xs: 'h-10 w-10', sm: 'h-12 w-12', md: 'h-14 w-14', lg: 'h-20 w-20', xl: 'h-[88px] w-[88px]' };
const EMPTY = { xs: 'h-10 w-10', sm: 'h-12 w-12', md: 'h-14 w-14', lg: 'h-20 w-20', xl: 'h-[88px] w-[88px]' };
// İsim alanı koltuk genişliğini aşmaz: uzun isimler satırı yana taşırmaz.
const NAME = { xs: 'max-w-[42px]', sm: 'max-w-[52px]', md: 'max-w-[68px]', lg: 'max-w-[88px]', xl: 'max-w-[96px]' };

/** Tek koltuk: boş koltukta + ve numara, dolu koltukta profil görseli ve isim. */
function VoiceSeat({ seat, index, size = 'md', musicPlaying, speaking, isSelf, isOwner, isMod, accent = '#ef4444', gifted, onClick, onSelect, micMuted, profile, cosmeticChoice, boardActive = false, score = 0, fullName = false, nameSpace }) {
  const handleClick = onSelect ? () => onSelect(index) : onClick;
  const cell = CELL[size] || CELL.md;
  const face = FACE[size] || FACE.md;
  const ring = RING[size] || RING.md;
  const emptyCircle = EMPTY[size] || EMPTY.md;
  const nameWidth = NAME[size] || NAME.md;
  // Bekleyen koltuk daveti: kişi profiliyle görünür ama mikrofonu ve konuşması kapalıdır.
  const pending = Boolean(seat?.pending);
  const muted = !pending && Boolean(seat?.muted || micMuted);

  if (!seat?.user_id) {
    return (
      <button type="button" onClick={handleClick} className="flex flex-col items-center gap-1 active:scale-95 transition-transform" aria-label={`${index + 1}. koltuk`}>
        <span className={`flex ${cell} shrink-0 items-center justify-center`}>
          <span className={`relative flex ${emptyCircle} items-center justify-center`}>
            <SeatArt className="block h-full w-full scale-[1.25] object-contain" />
            {seat?.locked && (
              <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-full bg-black/45">
                <Lock className="h-[50%] w-[50%] text-white" />
              </span>
            )}
            {/* Mikrofonu kendi elimle kapattığımda görünen sade rozet; mikrofonu açınca kaybolur. */}
            {micMuted && (
              <span aria-label="Mikrofon kapalı" className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-white/25 bg-black/80">
                <MicOff className="h-2.5 w-2.5 text-white/80" />
              </span>
            )}
          </span>
        </span>
        {boardActive && <span className="invisible" aria-hidden="true"><VoiceSeatScore value={0} size={size} /></span>}
        <span className="flex h-3 items-center text-[10px] font-medium leading-none text-white/85">{index + 1}</span>
      </button>
    );
  }

  // Hediye alma anı, hediyenin K seviyesi rengiyle parlar. Alıcı seçimi koltukta işaretlenmez.
  const halo = gifted ? `0 0 0 2px ${accent}, 0 0 26px ${accent}` : undefined;
  // Gizli kullanıcı: koltukta maskeli profil ve kırmızı takma ad görünür, rozet taşımaz.
  const hidden = isHiddenName(seat.name);
  const nameTheme = !hidden && vipLook(profile, 'name');

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex ${cell.split(' ')[1]} flex-col items-center gap-1 active:scale-95 transition-transform`}
      aria-label={`${seat.name || 'Koltuk'}${muted ? ', mikrofon kapalı' : ''}`}
    >
      <span className={`relative flex ${cell} shrink-0 items-center justify-center`}>
        {musicPlaying && <span aria-label="Müzik çalıyor" className={`pointer-events-none absolute ${ring} z-[7] rounded-full room-music-glow`} />}
        {speaking && !muted && !pending && <VoiceSpeakingWave index={index} ring={ring} theme={!hidden && vipLook(profile, 'mic')} />}
        {halo && <span className="pointer-events-none absolute inset-0 z-[6] rounded-full" style={{ boxShadow: halo }} />}
        <span className={`relative ${face}`}>
          <VoiceSeatPortrait seat={seat} animated={!hidden && !!vipLook(profile, 'avatar')} className="h-full w-full" variant={index} theme={!hidden && vipLook(profile, 'frame')} cosmeticChoice={!hidden ? cosmeticChoice : null} />
          {/* Mikrofon kapalı rozeti çemberin sağ alt köşesinde durur. */}
          {muted && (
            <span title="Mikrofon kapalı" aria-label="Mikrofon kapalı" className="absolute -bottom-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-destructive">
              <MicOff className="h-3 w-3 text-white" />
            </span>
          )}
        </span>
        {pending && (
          <span aria-label="Koltuk daveti onayı bekleniyor" title="Koltuk daveti onayı bekleniyor" className="pointer-events-none absolute -bottom-0.5 -left-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full border border-premium-gold/70 bg-black/85">
            <Hourglass className="h-2.5 w-2.5 text-premium-gold" />
          </span>
        )}
        {gifted && (
          <span className="gift-pop pointer-events-none absolute -top-5 left-1/2 z-30 -translate-x-1/2 text-lg leading-none">{gifted}</span>
        )}
      </span>
      {boardActive && <VoiceSeatScore value={score} size={size} />}
      <VoiceSeatName name={seat.name} fullName={fullName} width={nameSpace} hidden={hidden} isOwner={isOwner} isMod={isMod} color={gifted ? accent : nameTheme?.accent || '#ffffff'} />
    </button>
  );
}

export default memo(VoiceSeat, (previous, next) => {
  const { seat: previousSeat, ...previousProps } = previous;
  const { seat: nextSeat, ...nextProps } = next;
  return shallowEqual(previousSeat, nextSeat) && shallowEqual(previousProps, nextProps);
});