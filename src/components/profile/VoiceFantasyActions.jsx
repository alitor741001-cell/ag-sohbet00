import { useState } from 'react';
import { AtSign, LockKeyhole, LockKeyholeOpen, LogOut, MessageSquare, Mic, MicOff, Loader2, Shield, ShieldOff, UserCheck } from 'lucide-react';
import ProfileSocialRow from '@/components/profile/social/ProfileSocialRow';
import VoiceGiftButton from '@/components/profile/VoiceGiftButton';
import { useToast } from '@/components/ui/use-toast';

export default function VoiceFantasyActions({ room, userId, name, isSelf, hidden, onClose, onMessage, giftInAdminRow = false }) {
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
  // Hediye düğmesi tek bir yerde durur: kendi kartında "Koltuktan İn" yanında,
  // başkasının kartında "Takip Et" yanında, yönetici kartında "AG Yetkilisi" yanında.
  const gift = room?.gift ? () => perform('gift', () => room.gift(userId)) : null;
  const seatGift = !!gift && isSelf && seat >= 0;
  const socialGift = !!gift && !isSelf && !hidden && !giftInAdminRow;
  const bottomGift = !!gift && !seatGift && !socialGift && !giftInAdminRow;
  const manageItems = [
    ...(seat >= 0 && room.canControl(userId) ? [{ key: 'mic', label: muted ? 'Mik Aç' : 'Mik Kapat', icon: muted ? MicOff : Mic, action: () => room.toggleMic(userId) }] : []),
    ...(seat >= 0 && room.canModerate ? [{ key: 'lock', label: locked ? 'Kilidi Aç' : 'Koltuğu Kilitle', icon: locked ? LockKeyholeOpen : LockKeyhole, action: () => room.lockSeat(seat, !locked) }] : []),
    ...(seat < 0 && room.canModerate && !isSelf && room.hasFreeSeat?.() ? [{ key: 'assign', label: 'Koltuğa Al', icon: UserCheck, action: () => room.seatAssign(userId) }] : []),
    ...(seat >= 0 && room.canControl(userId) && !isSelf ? [{ key: 'stand', label: 'Koltuktan İndir', icon: LogOut, action: () => room.standUp(userId) }] : []),
  ];
  // Bahset, Odadan At ve Özel Mesaj aynı satırda durur: özel mesaj en sağdadır.
  const items = [
    ...(!isSelf && !hidden ? [
      { key: 'mention', label: 'Bahset', icon: AtSign, action: () => room.mention(name) },
      ...(room.canModerate ? [{ key: 'kick', label: 'Odadan At', icon: LogOut, action: () => room.kick(userId), danger: true }] : []),
      { key: 'message', label: 'Özel Mesaj', icon: MessageSquare, action: () => room.message ? room.message(userId) : onMessage?.(userId) },
    ] : []),
  ];
  return (
    <div className="space-y-2">
      {!isSelf && !hidden && <ProfileSocialRow userId={userId} accent="var(--fantasy-accent-color)" leadingAction={room.canModerate && (
        <button type="button" disabled={!!busy} onClick={() => perform('mod', () => room.toggleModerator(userId, !targetIsMod))} className="voice-fantasy-button flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl border-2 px-2 py-1.5 text-[10px] font-black disabled:opacity-50">
          {busy === 'mod' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : targetIsMod ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
          {targetIsMod ? 'Yönetici ✓' : 'Yönetici'}
        </button>
      )} trailingAction={socialGift ? <VoiceGiftButton onClick={gift} busy={busy === 'gift'} compact /> : null} />}
      {room.canModerate && !isSelf && manageItems.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {manageItems.map(({ key, label, icon: Icon, action, danger }) => (
            <button key={key} type="button" disabled={!!busy} onClick={() => perform(key, action)} className={`voice-fantasy-button flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold disabled:opacity-50 ${danger ? 'text-destructive' : ''}`}>
              {busy === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}<span>{label}</span>
            </button>
          ))}
        </div>
      )}
      {isSelf && seat >= 0 && (
        <div className={`grid gap-2 ${seatGift ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <button type="button" disabled={!!busy} onClick={() => perform('stand', () => room.standUp(userId))} className="voice-fantasy-button flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold disabled:opacity-50">
            {busy === 'stand' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}<span>Koltuktan İn</span>
          </button>
          {seatGift && <VoiceGiftButton onClick={gift} busy={busy === 'gift'} />}
        </div>
      )}
      {items.length > 0 && (
        <div className={`grid gap-2 ${items.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {items.map(({ key, label, icon: Icon, action, danger }) => (
            <button key={key} type="button" disabled={!!busy} onClick={() => perform(key, action)} className={`voice-fantasy-button flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold disabled:opacity-50 ${danger ? 'text-destructive' : ''}`}>
              {busy === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}<span>{label}</span>
            </button>
          ))}
        </div>
      )}
      {bottomGift && (
        <div className="flex justify-center pt-2">
          <VoiceGiftButton onClick={gift} busy={busy === 'gift'} />
        </div>
      )}
    </div>
  );
}