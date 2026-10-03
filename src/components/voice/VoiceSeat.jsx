import { Crown, Lock, MicOff, Plus, Shield } from 'lucide-react';
import ProfileFrame from '@/components/ProfileFrame';
import XpAvatar from '@/components/xp/XpAvatar';

/** Tek koltuk: boş koltukta + ve numara, dolu koltukta profil görseli ve isim. */
export default function VoiceSeat({ seat, index, size = 'md', speaking, isSelf, isOwner, isMod, onClick }) {
  const circle = size === 'sm' ? 'h-12 w-12' : 'h-16 w-16';

  if (!seat?.user_id) {
    return (
      <button type="button" onClick={onClick} className="flex flex-col items-center gap-1 active:scale-95 transition-transform" aria-label={`${index + 1}. koltuk`}>
        <span className={`flex ${circle} items-center justify-center rounded-full border ${seat?.locked ? 'border-amber-400/70 bg-amber-500/10' : 'border-white/25 bg-black/40'}`}>
          {seat?.locked ? <Lock className="h-4 w-4 text-amber-400" /> : <Plus className="h-5 w-5 text-white/80" />}
        </span>
        <span className="text-[10px] leading-none text-white/60">{index + 1}</span>
      </button>
    );
  }

  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1 active:scale-95 transition-transform" aria-label={seat.name || 'Koltuk'}>
      <span className={`relative rounded-full ${speaking ? 'speaking-glow' : ''}`}>
        {seat.frame
          ? <ProfileFrame frame={seat.frame} avatar={seat.avatar} name={seat.name} size={size} frameScale={seat.frame_scale} />
          : <XpAvatar avatar={seat.avatar} name={seat.name} size={size} />}
        {seat.muted && (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600">
            <MicOff className="h-3 w-3 text-white" />
          </span>
        )}
      </span>
      <span className="flex max-w-[68px] items-center gap-0.5 truncate text-[10px] leading-none text-white">
        {isOwner && <Crown className="h-3 w-3 shrink-0 text-amber-400" />}
        {!isOwner && isMod && <Shield className="h-3 w-3 shrink-0 text-sky-400" />}
        <span className="truncate">{isSelf ? 'Sen' : seat.name}</span>
      </span>
    </button>
  );
}