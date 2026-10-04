import { Check, Crown, Lock, MicOff, Plus, Shield } from 'lucide-react';
import ProfileFrame from '@/components/ProfileFrame';

// Her koltuk aynı boyutta sabit bir portre alanı kullanır: profil boyutu değişse de
// ızgara kaymaz, çerçeveler komşu koltuğa taşmaz.
const CELL = { sm: 'h-[52px] w-[52px]', md: 'h-[68px] w-[68px]' };
const FACE = { sm: 'h-[26px] w-[26px]', md: 'h-[38px] w-[38px]' };
const RING = { sm: 'h-[30px] w-[30px]', md: 'h-[46px] w-[46px]' };
const EMPTY = { sm: 'h-12 w-12', md: 'h-14 w-14' };
const FRAME = { sm: 'xs', md: 'sm' };
const BADGE = { sm: 'translate-x-[5px] translate-y-[5px]', md: 'translate-x-[9px] translate-y-[9px]' };
const FRAME_SCALE = 0.78;

/** Tek koltuk: boş koltukta + ve numara, dolu koltukta profil görseli ve isim. */
export default function VoiceSeat({ seat, index, size = 'md', speaking, isSelf, isOwner, isMod, selected, accent = '#ef4444', gifted, onClick }) {
  const cell = CELL[size] || CELL.md;
  const face = FACE[size] || FACE.md;
  const ring = RING[size] || RING.md;
  const emptyCircle = EMPTY[size] || EMPTY.md;
  const badge = BADGE[size] || BADGE.md;

  if (!seat?.user_id) {
    return (
      <button type="button" onClick={onClick} className="flex flex-col items-center gap-1 active:scale-95 transition-transform" aria-label={`${index + 1}. koltuk`}>
        <span className={`flex ${cell} shrink-0 items-center justify-center`}>
          <span className={`flex ${emptyCircle} items-center justify-center rounded-full border ${seat?.locked ? 'border-amber-400/70 bg-amber-500/10' : 'border-white/25 bg-black/40'}`}>
            {seat?.locked ? <Lock className="h-4 w-4 text-amber-400" /> : <Plus className="h-5 w-5 text-white/80" />}
          </span>
        </span>
        <span className="text-[10px] leading-none text-white/60">{index + 1}</span>
      </button>
    );
  }

  // Seçim ve hediye alma anı aynı renk tonunu kullanır (K seviyesine göre).
  const halo = selected
    ? `0 0 0 2px ${accent}, 0 0 18px ${accent}`
    : gifted
      ? `0 0 0 2px ${accent}, 0 0 26px ${accent}`
      : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 active:scale-95 transition-transform ${selected ? 'scale-105' : ''}`}
      aria-label={`${seat.name || 'Koltuk'}${selected ? ' (seçili)' : ''}`}
      aria-pressed={!!selected}
    >
      <span className={`relative flex ${cell} shrink-0 items-center justify-center`}>
        {speaking && <span className={`pointer-events-none absolute ${ring} z-[5] rounded-full speaking-glow`} />}
        {halo && <span className="pointer-events-none absolute inset-0 z-[6] rounded-full" style={{ boxShadow: halo }} />}
        {seat.frame ? (
          <span className="absolute inset-0 flex items-center justify-center" style={{ transform: `scale(${FRAME_SCALE})` }}>
            <ProfileFrame frame={seat.frame} avatar={seat.avatar} name={seat.name} size={FRAME[size] || FRAME.md} frameScale={seat.frame_scale} />
          </span>
        ) : (
          <span className={`relative flex ${face} items-center justify-center overflow-hidden rounded-full`}>
            {seat.avatar
              ? <img src={seat.avatar} alt={seat.name || 'Profil'} className="h-full w-full object-cover object-center" referrerPolicy="no-referrer" draggable={false} />
              : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-accent text-[11px] font-bold text-white">{(seat.name || '?')[0]}</span>}
          </span>
        )}
        {seat.muted && (
          <span className={`absolute left-1/2 top-1/2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 ${badge}`}>
            <MicOff className="h-3 w-3 text-white" />
          </span>
        )}
        {selected && (
          <span className="gift-pop absolute -right-1 -top-1 z-30 flex h-5 w-5 items-center justify-center rounded-full" style={{ background: accent }}>
            <Check className="h-3 w-3 text-black" />
          </span>
        )}
        {gifted && (
          <span className="gift-pop pointer-events-none absolute -top-5 left-1/2 z-30 -translate-x-1/2 text-lg leading-none">{gifted}</span>
        )}
      </span>
      <span className="flex max-w-[68px] items-center gap-0.5 truncate text-[10px] leading-none" style={{ color: selected || gifted ? accent : '#ffffff' }}>
        {isOwner && <Crown className="h-3 w-3 shrink-0 text-amber-400" />}
        {!isOwner && isMod && <Shield className="h-3 w-3 shrink-0 text-sky-400" />}
        <span className="truncate">{isSelf ? 'Sen' : seat.name}</span>
      </span>
    </button>
  );
}