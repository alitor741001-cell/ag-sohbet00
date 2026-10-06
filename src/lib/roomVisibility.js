// Oda görünürlüğü anında yayılır: odada Gizle/Göster denince ana sayfa listesi canlı
// bağlantıyı beklemeden güncellenir. Sayfa yenilenmez, ek istek yapılmaz.
const EVENT = 'room-visibility';

export function broadcastRoomVisibility(id, hidden) {
  if (!id || typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { id, hidden: !!hidden } }));
}

/** Ana sayfa dinler; abonelikten çıkmak için dönen işlev çağrılır. */
export function onRoomVisibility(handler) {
  if (typeof window === 'undefined') return () => {};
  const listener = (event) => handler(event.detail || {});
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}