/**
 * Küçültülmüş sesli oda durumu.
 * Sayfa değişse bile oda ve koltuk korunur; sağ alttaki balon bu kaydı okur.
 */
let current = null;
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener(current));
}

export function subscribeMinimizedRoom(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getMinimizedRoom() {
  return current;
}

export function setMinimizedRoom(room) {
  current = room || null;
  emit();
}

export function clearMinimizedRoom() {
  current = null;
  emit();
}

/** Bu oda küçültülmüş mü — sayfadan çıkılırken odadan düşmeyi engeller. */
export function isRoomMinimized(roomId) {
  return !!current && !!roomId && current.id === roomId;
}