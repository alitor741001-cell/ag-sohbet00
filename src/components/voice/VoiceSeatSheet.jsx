import { Lock, LogOut, Mic, MicOff, Plus, Shield, Unlock, UserMinus, UserRound } from 'lucide-react';
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

/** Koltuk detayı: boş koltukta oturma/kilit, kendi koltuğumda ayağa kalkma, başkasının koltuğunda yönetici işlemleri. */
export default function VoiceSeatSheet({ open, onClose, seat, index, userId, ownerId, canMod, targetIsMod, onTakeSeat, onLeaveSeat, onKick, onToggleMute, onToggleMod, onToggleLock, onOpenProfile }) {
  if (!seat) return null;
  const empty = !seat.user_id;
  const mine = seat.user_id === userId;
  const muted = !!seat.muted;

  return (
    <VoiceSheet open={open} onClose={onClose} title={`${(index || 0) + 1}. Koltuk`}>
      <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#171720] p-3">
        {empty ? (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/40">
            {seat.locked ? <Lock className="h-5 w-5 text-amber-400" /> : <Plus className="h-5 w-5 text-white/70" />}
          </span>
        ) : seat.frame
          ? <ProfileFrame frame={seat.frame} avatar={seat.avatar} name={seat.name} size="sm" frameScale={seat.frame_scale} />
          : <XpAvatar avatar={seat.avatar} name={seat.name} size="sm" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{empty ? 'Boş koltuk' : `${seat.name}${mine ? ' (Sen)' : ''}`}</p>
          <p className="text-[11px] text-white/50">
            {empty
              ? (seat.locked ? 'Kilitli koltuk' : 'Sese açık')
              : seat.user_id === ownerId ? 'Oda sahibi' : targetIsMod ? 'Oda yöneticisi' : 'Konuşmacı'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {empty && <Action icon={UserRound} label="Otur" tone="primary" onClick={onTakeSeat} />}
        {mine && <Action icon={LogOut} label="Ayağa kalk" onClick={onLeaveSeat} />}
        {!empty && !mine && <Action icon={UserRound} label="Profili gör" onClick={onOpenProfile} />}
        {canMod && <Action icon={seat.locked ? Unlock : Lock} label={seat.locked ? 'Koltuğun kilidini aç' : 'Koltuğu kilitle'} tone="amber" onClick={onToggleLock} />}
        {!empty && !mine && canMod && (
          <>
            <Action icon={muted ? Mic : MicOff} label={muted ? 'Mikrofonunu aç' : 'Mikrofonunu kapat'} onClick={onToggleMute} />
            <Action icon={Shield} label={targetIsMod ? 'Yönetici yetkisini al' : 'Yönetici yap'} tone="sky" onClick={onToggleMod} />
            <Action icon={UserMinus} label="Koltuktan indir ve odadan at" tone="danger" onClick={onKick} />
          </>
        )}
      </div>
    </VoiceSheet>
  );
}