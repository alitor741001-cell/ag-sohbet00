import { base44 } from '@/api/base44Client';

// Oda kartına dokunulduğunda oda verisi önden istenir: oda sayfası açılırken hazır olur.
const MAX_AGE = 15000;
// Kaydırma sırasında gereksiz istek açılmasın: kısa bir beklemeden sonra, hareket yoksa başlar.
const HOLD_MS = 150;
const pending = new Map();
const timers = new Map();

export function prefetchRoom(roomId) {
  if (!roomId || pending.has(roomId)) return;
  const entry = {
    at: Date.now(),
    promise: base44.functions.invoke('room-presence', { action: 'get', room_id: roomId }).catch(() => null),
  };
  pending.set(roomId, entry);
  window.setTimeout(() => { if (pending.get(roomId) === entry) pending.delete(roomId); }, MAX_AGE);
}

/** Parmak karta basılı kaldığında çağrılır; kaydırma başlarsa `prefetchRoomCancel` ile iptal edilir. */
export function prefetchRoomSoon(roomId) {
  prefetchRoomCancel(roomId);
  timers.set(roomId, window.setTimeout(() => {
    timers.delete(roomId);
    prefetchRoom(roomId);
  }, HOLD_MS));
}

export function prefetchRoomCancel(roomId) {
  const timer = timers.get(roomId);
  if (timer) {
    window.clearTimeout(timer);
    timers.delete(roomId);
  }
}

/** Önden alınan cevap taze ise kullanılır, değilse null döner (sayfa kendi isteğini yapar). */
export function takeRoomPrefetch(roomId) {
  const entry = pending.get(roomId);
  if (!entry) return null;
  pending.delete(roomId);
  return Date.now() - entry.at <= MAX_AGE ? entry.promise : null;
}