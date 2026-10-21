import { memo } from 'react';
import { Crown, Lock, MicOff, Plus, Shield } from 'lucide-react';
import shallowEqual from '@/components/data/shallowEqual';
import VoiceSeatPortrait from '@/components/voice/VoiceSeatPortrait';
import VoiceSeatRing from '@/components/voice/VoiceSeatRing';
import { isHiddenName } from '@/lib/hiddenUser';

// Her koltuk aynı boyutta sabit bir portre alanı kullanır: profil boyutu değişse de
// ızgara kaymaz, çerçeveler komşu koltuğa taşmaz.
const CELL = { xs: 'h-[42px] w-[42px]', sm: 'h-[52px] w-[52px]', md: 'h-[68px] w-[68px]', lg: 'h-[88px] w-[88px]', xl: 'h-[96px] w-[96px]' };
const FACE = { xs: 'h-10 w-10', sm: 'h-12 w-12', md: 'h-14 w-14', lg: 'h-20 w-20', xl: 'h-[88px] w-[88px]' };
const RING = { xs: 'h-10 w-10', sm: 'h-12 w-12', md: 'h-14 w-14', lg: 'h-20 w-20', xl: 'h-[88px] w-[88px]' };
const EMPTY = { xs: 'h-10 w-10', sm: 'h-12 w-12', md: 'h-14 w-14', lg: 'h-20 w-20', xl: 'h-[88px] w-[88px]' };
const BADGE = { xs: 'translate-x-[3px] translate-y-[3px]', sm: 'translate-x-[5px] translate-y-[5px]', md: 'translate-x-[9px] translate-y-[9px]', lg: 'translate-x-[12px] translate-y-[12px]', xl: 'translate-x-[14px] translate-y-[14px]' };
// İsim alanı koltuk genişliğini aşmaz: uzun isimler satırı yana taşırmaz.
const NAME = { xs: 'max-w-[42px]', sm: 'max-w-[52px]', md: 'max-w-[68px]', lg: 'max-w-[88px]', xl: 'max-w-[96px]' };
// Kilit ve + ikonları koltuk büyüdükçe büyür: referanstaki oran korunur.
const ICON = { xs: 'h-3.5 w-3.5', sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-7 w-7', xl: 'h-7 w-7' };

/** Tek koltuk: boş koltukta + ve numara, dolu koltukta profil görseli ve isim. */
function VoiceSeat({ seat, index, size = 'md', musicPlaying, speaking, gender, isSelf, isOwner, isMod, accent = '#ef4444', gifted, onClick, onSelect, micMuted }) {
  const handleClick = onSelect ? () => onSelect(index) : onClick;
  const cell = CELL[size] || CELL.md;
  const face = FACE[size] || FACE.md;
  const ring = RING[size] || RING.md;
  const emptyCircle = EMPTY[size] || EMPTY.md;
  const badge = BADGE[size] || BADGE.md;
  const nameWidth = NAME[size] || NAME.md;
  const iconSize = ICON[size] || ICON.md;
  // Konuşma dalgası rengi: erkeklerde mavi, kadınlarda pembe.
  const speakingGender = gender === 'erkek' ? 'erkek' : 'kadin';

  if (!seat?.user_id) {
    return (
      <button type="button" onClick={handleClick} className="flex flex-col items-center gap-1 active:scale-95 transition-transform" aria-label={`${index + 1}. koltuk`}>
        <span className={`flex ${cell} shrink-0 items-center justify-center`}>
          <span className={`relative flex ${emptyCircle} items-center justify-center`}>
            <VoiceSeatRing className="h-full w-full" variant={index} glow="0 4px 12px -6px rgba(0,0,0,0.9)">
              <span className="flex h-full w-full items-center justify-center" style={{ background: 'radial-gradient(circle at 32% 24%, rgba(108,212,214,0.28) 0%, rgba(10,20,34,0.96) 70%)' }}>
                {seat?.locked ? <Lock className={`${iconSize} text-[#ffe6a8]`} /> : <Plus className={`${iconSize} text-[#e8c47c]`} />}
              </span>
            </VoiceSeatRing>
            {/* Mikrofonu kendi elimle kapattığımda görünen sade rozet; mikrofonu açınca kaybolur. */}
            {micMuted && (
              <span aria-label="Mikrofon kapalı" className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-white/25 bg-black/80">
                <MicOff className="h-2.5 w-2.5 text-white/80" />
              </span>
            )}
          </span>
        </span>
        <span className="text-[10px] font-medium leading-none text-white/85">{index + 1}</span>
      </button>
    );
  }

  // Hediye alma anı, hediyenin K seviyesi rengiyle parlar. Alıcı seçimi koltukta işaretlenmez.
  const halo = gifted ? `0 0 0 2px ${accent}, 0 0 26px ${accent}` : undefined;
  // Gizli kullanıcı: koltukta maskeli profil ve kırmızı takma ad görünür, rozet taşımaz.
  const hidden = isHiddenName(seat.name);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
      aria-label={seat.name || 'Koltuk'}
    >
      <span className={`relative flex ${cell} shrink-0 items-center justify-center`}>
        {musicPlaying && <span aria-label="Müzik çalıyor" className={`pointer-events-none absolute ${ring} z-[7] rounded-full room-music-glow`} />}
        {/* Konuşma ses dalgası: çemberin dışına pembe/mavi halkalar olarak taşar. */}
        {speaking && <span data-gender={speakingGender} aria-hidden="true" className={`voice-speaking-wave pointer-events-none absolute ${ring} z-[5] rounded-full`} />}
        {halo && <span className="pointer-events-none absolute inset-0 z-[6] rounded-full" style={{ boxShadow: halo }} />}
        <VoiceSeatPortrait seat={seat} className={face} variant={index} />
        {seat.muted && (
          <span className={`absolute left-1/2 top-1/2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 ${badge}`}>
            <MicOff className="h-3 w-3 text-white" />
          </span>
        )}
        {gifted && (
          <span className="gift-pop pointer-events-none absolute -top-5 left-1/2 z-30 -translate-x-1/2 text-lg leading-none">{gifted}</span>
        )}
      </span>
      <span className={`flex ${nameWidth} items-center gap-0.5 truncate text-[10px] leading-none`} style={{ color: gifted ? accent : '#ffffff' }}>
        {!hidden && isOwner && <Crown className="h-3 w-3 shrink-0 text-amber-400" />}
        {!hidden && !isOwner && isMod && <Shield className="h-3 w-3 shrink-0 text-sky-400" />}
        <span className={`truncate ${hidden ? 'hidden-user-name' : ''}`}>{isSelf ? 'Sen' : seat.name}</span>
      </span>
    </button>
  );
}

export default memo(VoiceSeat, (previous, next) => {
  const { seat: previousSeat, ...previousProps } = previous;
  const { seat: nextSeat, ...nextProps } = next;
  return shallowEqual(previousSeat, nextSeat) && shallowEqual(previousProps, nextProps);
});