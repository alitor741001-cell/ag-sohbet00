import { useState } from 'react';
import { AtSign, Gift, LockKeyhole, LockKeyholeOpen, LogOut, MessageSquare, Mic, MicOff, Loader2, Shield, ShieldOff, UserCheck } from 'lucide-react';
import FollowButton from '@/components/profile/social/FollowButton';
import { useToast } from '@/components/ui/use-toast';

export default function VoiceFantasyActions({ room, userId, name, isSelf, hidden, onClose, onMessage }) {
  const [busy, setBusy] = useState('');
  const { toast } = useToast();
  const seat = room.seatFor(userId);
  const locked = seat >= 0 && room.isLocked(seat);
  const muted = isSelf ? room.selfMicMuted : room.mutedOf(userId);
  const targetIsMod = !isSelf && room.isModeratorOf?.(userId);
  const perform = async (key, action) => {
    if (busy) return;
    setBusy(key);
    try { await action(); }
    catch (error) { toast({ title: 'İşlem yapılamadı', description: error?.response?.data?.error || error.message, variant: 'destructive' }); }
    finally { setBusy(''); }
  };
  const manageItems = [
    ...(seat >= 0 && room.canControl(userId) ? [{ key: 'mic', label: muted ? 'Mik Aç' : 'Mik Kapat', icon: muted ? MicOff : Mic, action: () => room.toggleMic(userId) }] : []),
    ...(seat >= 0 && room.canModerate ? [{ key: 'lock', label: locked ? 'Kilidi Aç' : 'Koltuğu Kilitle', icon: locked ? LockKeyholeOpen : LockKeyhole, action: () => room.lockSeat(seat, !locked) }] : []),
    ...(seat < 0 && room.canModerate && !isSelf && room.hasFreeSeat?.() ? [{ key: 'assign', label: 'Koltuğa Al', icon: UserCheck, action: () => room.seatAssign(userId) }] : []),
    ...(seat >= 0 && room.canControl(userId) ? [{ key: 'stand', label: isSelf ? 'Koltuktan İn' : 'Koltuktan İndir', icon: LogOut, action: () => room.standUp(userId) }] : []),
    ...(room.canModerate && !isSelf ? [{ key: 'kick', label: 'Odadan At', icon: LogOut, action: () => room.kick(userId), danger: true }] : []),
  ];
  const items = [
    ...(!isSelf && !hidden ? [
      { key: 'mention', label: 'Bahset', icon: AtSign, action: () => room.mention(name) },
      { key: 'message', label: 'Özel Mesaj', icon: MessageSquare, action: () => room.message ? room.message(userId) : onMessage?.(userId) },
    ] : []),
  ];
  return (
    <div className="space-y-2">
      {!isSelf && !hidden && <FollowButton userId={userId} accent="var(--fantasy-accent-color)" compact />}
      {room.canModerate && !isSelf && (
        <button type="button" disabled={!!busy} onClick={() => perform('mod', () => room.toggleModerator(userId, !targetIsMod))} className="voice-fantasy-button flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-[11px] font-bold disabled:opacity-50">
          {busy === 'mod' ? <Loader2 className="h-4 w-4 animate-spin" /> : targetIsMod ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
          {targetIsMod ? 'Yönetici ✓' : 'Yönet'}
        </button>
      )}
      {room.canModerate && !isSelf && manageItems.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {manageItems.map(({ key, label, icon: Icon, action, danger }) => (
            <button key={key} type="button" disabled={!!busy} onClick={() => perform(key, action)} className={`voice-fantasy-button flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold disabled:opacity-50 ${danger ? 'text-destructive' : ''}`}>
              {busy === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}<span>{label}</span>
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {items.map(({ key, label, icon: Icon, action }) => (
          <button key={key} type="button" disabled={!!busy} onClick={() => perform(key, action)} className="voice-fantasy-button flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold disabled:opacity-50">
            {busy === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}<span>{label}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-center pt-2">
        <button type="button" disabled={!!busy} onClick={() => perform('gift', () => room.gift(userId))} className="voice-fantasy-button voice-fantasy-gift flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-2 text-[11px] font-bold disabled:opacity-50">
          {busy === 'gift' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />} Hediye Gönder
        </button>
      </div>
    </div>
  );
}