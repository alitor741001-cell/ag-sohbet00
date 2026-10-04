import { Crown, Lock, MicOff, Plus, Shield } from 'lucide-react';
import VoiceSeatPortrait from '@/components/voice/VoiceSeatPortrait';
import { isHiddenName } from '@/lib/hiddenUser';

// Her koltuk aynı boyutta sabit bir portre alanı kullanır: profil boyutu değişse de
// ızgara kaymaz, çerçeveler komşu koltuğa taşmaz.
const CELL = { xs: 'h-[42px] w-[42px]', sm: 'h-[52px] w-[52px]', md: 'h-[68px] w-[68px]', lg: 'h-[88px] w-[88px]' };
const FACE = { xs: 'h-10 w-10', sm: 'h-12 w-12', md: 'h-14 w-14', lg: 'h-20 w-20' };
const RING = { xs: 'h-10 w-10', sm: 'h-12 w-12', md: 'h-14 w-14', lg: 'h-20 w-20' };
const EMPTY = { xs: 'h-10 w-10', sm: 'h-12 w-12', md: 'h-14 w-14', lg: 'h-20 w-20' };
const FRAME = { xs: '2xs', sm: 'xs', md: 'sm', lg: 'md' };
const BADGE = { xs: 'translate-x-[3px] translate-y-[3px]', sm: 'translate-x-[5px] translate-y-[5px]', md: 'translate-x-[9px] translate-y-[9px]', lg: 'translate-x-[12px] translate-y-[12px]' };
// İsim alanı koltuk genişliğini aşmaz: uzun isimler satırı yana taşırmaz.
const NAME = { xs: 'max-w-[42px]', sm: 'max-w-[52px]', md: 'max-w-[68px]', lg: 'max-w-[88px]' };
const FRAME_SCALE = 0.78;

/** Tek koltuk: boş koltukta + ve numara, dolu koltukta profil görseli ve isim. */
export default function VoiceSeat({ seat, index, size = 'md', speaking, isSelf, isOwner, isMod, accent = '#ef4444', gifted, onClick, micMuted }) {
  const cell = CELL[size] || CELL.md;
  const face = FACE[size] || FACE.md;
  const ring = RING[size] || RING.md;
  const emptyCircle = EMPTY[size] || EMPTY.md;
  const badge = BADGE[size] || BADGE.md;
  const nameWidth = NAME[size] || NAME.md;

  if (!seat?.user_id) {
    return (
      <button type="button" onClick={onClick} className="flex flex-col items-center gap-1 active:scale-95 transition-transform" aria-label={`${index + 1}. koltuk`}>
        <span className={`flex ${cell} shrink-0 items-center justify-center`}>
          <span className={`relative flex ${emptyCircle} items-center justify-center rounded-full border ${seat?.locked ? 'border-amber-400/70 bg-amber-500/10' : 'border-white/25 bg-black/40'}`}>
            {seat?.locked ? <Lock className="h-4 w-4 text-amber-400" /> : <Plus className="h-5 w-5 text-white/80" />}
            {/* Mikrofonum kapalıyken boş koltukta "mik kapalı" rozeti görünür; mikrofonu açınca kaybolur. */}
            {micMuted && (
              <span aria-label="Mikrofon kapalı" className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-white/20 bg-red-600">
                <MicOff className="h-2.5 w-2.5 text-white" />
              </span>
            )}
          </span>
        </span>
        <span className="text-[10px] leading-none text-white/60">{index + 1}</span>
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
      onClick={onClick}
      className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
      aria-label={seat.name || 'Koltuk'}
    >
      <span className={`relative flex ${cell} shrink-0 items-center justify-center`}>
        {speaking && <span className={`pointer-events-none absolute ${ring} z-[5] rounded-full speaking-glow`} />}
        {halo && <span className="pointer-events-none absolute inset-0 z-[6] rounded-full" style={{ boxShadow: halo }} />}
        <VoiceSeatPortrait seat={seat} className={face} />
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