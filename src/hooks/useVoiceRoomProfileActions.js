import { useMemo } from 'react';

/**
 * Sesli odanın profil kartına verdiği gerçek işlemler: mikrofon, koltuk kilidi,
 * hediye (alıcı seçili açılır), bahsetme (sohbet alanına @isim) ve özel sohbet.
 */
export default function useVoiceRoomProfileActions({
  seats, participants, canMod, userId, seated, voice, invokeVoice, toast, toggleMuteFor,
  openGifts, setSelectedIds, setMentionTarget, setChatOpen, setComposerOpen, setDmUserId, kickFromRoom,
}) {
  return useMemo(() => ({
    kind: 'voice',
    canModerate: canMod,
    kick: kickFromRoom,
    seatFor: (targetId) => (targetId ? seats.findIndex((seat) => seat?.user_id === targetId) : -1),
    isLocked: (index) => !!seats[index]?.locked,
    lockSeat: (index, locked) => invokeVoice({ action: 'seat-lock', seat_index: index, locked }),
    selfMicMuted: !!voice.muted,
    mutedOf: (targetId) => !!participants.find((person) => person?.user_id === targetId)?.muted,
    canControl: (targetId) => canMod || targetId === userId,
    standUp: (targetId) => {
      if (!targetId || targetId === userId) { invokeVoice({ action: 'seat-leave' }); return; }
      if (canMod) invokeVoice({ action: 'seat-kick', target_id: targetId });
    },
    toggleMic: (targetId) => {
      if (!targetId || targetId === userId) {
        if (!seated) {
          toast({ title: 'Konuşmak için bir koltuğa otur', description: 'Yukarıdaki boş bir koltuğa dokun.' });
          return;
        }
        voice.toggleMute();
        return;
      }
      toggleMuteFor(targetId);
    },
    mention: (targetName) => {
      const tag = String(targetName || '').trim();
      if (!tag) return;
      setMentionTarget({ name: tag, at: Date.now() });
      setChatOpen(true);
      setComposerOpen(true);
    },
    gift: (targetId) => {
      if (!targetId) return;
      setSelectedIds([targetId]);
      openGifts();
    },
    message: (targetId) => { if (targetId) setDmUserId(targetId); },
  }), [seats, participants, canMod, userId, seated, voice, invokeVoice, toast, toggleMuteFor, openGifts, setSelectedIds, setMentionTarget, setChatOpen, setComposerOpen, setDmUserId, kickFromRoom]);
}