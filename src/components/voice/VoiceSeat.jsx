import { memo } from 'react';
import { Crown, Lock, MicOff, Shield } from 'lucide-react';
import { Image } from '@/components/ui/image';
import shallowEqual from '@/components/data/shallowEqual';
import VoiceSeatPortrait from '@/components/voice/VoiceSeatPortrait';
import RefSeatFrame from '@/components/voice/RefSeatFrame';
import { isHiddenName } from '@/lib/hiddenUser';

/** Tek koltuk: tasarım görselindeki çerçeve. Boşsa görseldeki + ve numara; doluysa ortada profil.
 *  Kullanıcının kendi koltuk çerçevesi seçiliyse o çerçeve gösterilir. */
function VoiceSeat({ seat, index, speaking, isOwner, isMod, accent = '#ef4444', gifted, onClick, onSelect, micMuted, cosmeticChoice }) {
  const handleClick = onSelect ? () => onSelect(index) : onClick;
  const occupied = !!seat?.user_id;
  const hidden = occupied && isHiddenName(seat.name);
  const ownFrame = occupied && !hidden && cosmeticChoice?.seat_product_id;
  const muted = Boolean(seat?.muted || micMuted);

  return (
    <button type="button" onClick={handleClick} className="relative flex w-full flex-col items-center transition-transform active:scale-95" aria-label={occupied ? seat.name || 'Koltuk' : `${index + 1}. koltuk`}>
      {ownFrame ? (
        <span className="flex aspect-[145/185] w-full items-start justify-center pt-[12%]">
          <VoiceSeatPortrait seat={seat} className="h-auto w-[62%] aspect-square" variant={index} cosmeticChoice={cosmeticChoice} />
        </span>
      ) : (
        <RefSeatFrame index={index}>
          {occupied
            ? (seat.avatar ? <Image src={seat.avatar} alt={seat.name || 'Profil'} className="h-full w-full" fittingType="fill" draggable={false} /> : <span className="text-sm font-bold text-white">{(seat.name || '?').charAt(0)}</span>)
            : seat?.locked ? <Lock className="h-4 w-4 text-[#f2d79c]" /> : null}
        </RefSeatFrame>
      )}
      {speaking && !muted && <span className="pointer-events-none absolute left-1/2 top-[34%] aspect-square w-[60%] -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border-2 border-[#f4d77a]/70" />}
      {gifted && <span className="gift-pop pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2 text-lg leading-none">{gifted}</span>}
      {muted && occupied && (
        <span className="absolute right-[14%] top-[48%] z-10 flex h-4 w-4 items-center justify-center rounded-full bg-destructive"><MicOff className="h-2.5 w-2.5 text-white" /></span>
      )}
      {occupied && (
        <span className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-0.5 truncate rounded bg-black px-0.5 text-[10px] leading-tight" style={{ color: gifted ? accent : '#fff' }}>
          {!hidden && isOwner && <Crown className="h-3 w-3 shrink-0 text-amber-400" />}
          {!hidden && !isOwner && isMod && <Shield className="h-3 w-3 shrink-0 text-sky-400" />}
          <span className={`truncate ${hidden ? 'hidden-user-name' : ''}`}>{seat.name}</span>
        </span>
      )}
    </button>
  );
}

export default memo(VoiceSeat, (previous, next) => {
  const { seat: previousSeat, ...previousProps } = previous;
  const { seat: nextSeat, ...nextProps } = next;
  return shallowEqual(previousSeat, nextSeat) && shallowEqual(previousProps, nextProps);
});