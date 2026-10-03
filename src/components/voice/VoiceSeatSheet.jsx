import { Lock, LogOut, Mic, MicOff, Shield, Unlock, UserMinus, UserRound } from 'lucide-react';
import ProfileFrame from '@/components/ProfileFrame';
import XpAvatar from '@/components/xp/XpAvatar';
import VoiceSheet from '@/components/voice/VoiceSheet';

function Action({ icon: Icon, label, tone = 'default', onClick }) {
  const tones = {
    default: 'bg-white/10 text-white',
    danger: 'bg-red-600/20 text-red-300',
    primary: 'bg-primary/20 text-primary',
    sky: 'bg-sky-500/20 text-sky-300',
    amber: 'bg-amber-500/20 text-amber-300',
  };
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold active:scale-[0.98] transition-transform ${tones[tone]}`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

/** Koltuk detayı: kendi koltuğumsa kalkma, başkasının koltuğuysa yönetici işlemleri. */
export default function VoiceSeatSheet({ open, onClose, seat, index, userId, ownerId, canMod, isOwner, targetIsMod, onLeaveSeat, onKick, onToggleMute, onToggleMod, onToggleLock, onOpenProfile }) {
  if (!seat) return null;
  const mine = seat.user_id === userId;
  const muted = !!seat.muted;

  return (
    <VoiceSheet open={open} onClose={onClose} title={`${(index || 0) + 1}. Koltuk`}>
      <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#171720] p-3">
        {seat.frame
          ? <ProfileFrame frame={seat.frame} avatar={seat.avatar} name={seat.name} size="sm" frameScale={seat.frame_scale} />
          : <XpAvatar avatar={seat.avatar} name={seat.name} size="sm" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{seat.name}{mine && ' (Sen)'}</p>
          <p className="text-[11px] text-white/50">
            {seat.user_id === ownerId ? 'Oda sahibi' : targetIsMod ? 'Oda yöneticisi' : 'Konuşmacı'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {mine && <Action icon={LogOut} label="Koltuktan kalk" onClick={onLeaveSeat} />}
        {!mine && (
          <Action icon={UserRound} label="Profili gör" onClick={onOpenProfile} />
        )}
        {!mine && canMod && (
          <>
            <Action icon={muted ? Mic : MicOff} label={muted ? 'Mikrofonunu aç' : 'Mikrofonunu kapat'} onClick={onToggleMute} />
            <Action icon={seat.locked ? Unlock : Lock} label={seat.locked ? 'Koltuğun kilidini aç' : 'Koltuğu kilitle'} tone="amber" onClick={onToggleLock} />
            <Action icon={Shield} label={targetIsMod ? 'Yönetici yetkisini al' : 'Yönetici yap'} tone="sky" onClick={onToggleMod} />
            <Action icon={UserMinus} label="Koltuktan indir ve odadan at" tone="danger" onClick={onKick} />
          </>
        )}
        {mine && canMod && (
          <Action icon={seat.locked ? Unlock : Lock} label={seat.locked ? 'Koltuğun kilidini aç' : 'Koltuğumu kilitle'} tone="amber" onClick={onToggleLock} />
        )}
      </div>
    </VoiceSheet>
  );
}