// Küçültülmüş odanın ses oturumu.
// Oda küçültülüp sayfadan çıkıldığında ses bağlantısı, mikrofon yayını ve oda sesi
// yaşamaya devam eder; odaya dönüldüğünde aynı bağlantı yeniden kullanılır.
import { releaseSharedMic } from '@/lib/micSource';

const sessions = new Map();

/** Odaya dönüş için saklanan canlı ses oturumu. */
export function registerVoiceSession(roomId, session) {
  if (!roomId) return;
  sessions.set(roomId, session);
}

/** Saklanan oturumu devral: arayüz yeniden bağlanırken bağlantı kesilmez. */
export function takeVoiceSession(roomId) {
  if (!roomId) return null;
  const session = sessions.get(roomId) || null;
  sessions.delete(roomId);
  return session;
}

/** Odaya dönülmeyecekse oturumu tamamen kapat. */
export function disposeVoiceSession(roomId) {
  const session = takeVoiceSession(roomId);
  if (session) closeSession(session);
}

/** Aynı anda tek odanın sesi açık kalır: başka bir odaya girilirse eskisi kapatılır. */
export function disposeOtherVoiceSessions(keepRoomId) {
  [...sessions.keys()].forEach((roomId) => {
    if (roomId !== keepRoomId) disposeVoiceSession(roomId);
  });
}

function closeSession({ room, elements, stopTransient }) {
  stopTransient?.();
  try { if (room?.isMicOn?.()) sessionStorage.setItem('voice_mic_carry', '1'); } catch {}
  elements?.forEach((element) => { try { element.remove(); } catch {} });
  room?.stopMic?.();
  room?.close?.();
  releaseSharedMic();
}