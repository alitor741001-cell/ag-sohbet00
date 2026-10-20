/**
 * Oda sohbetinin bellekteki kopyası: sohbet paneli kapatılıp açıldığında
 * mesajlar kaybolmaz, liste aynen geri gelir.
 *
 * Kayıt oda bazında tutulur ve yalnızca oda sayfasından çıkılınca bırakılır;
 * sohbet elle temizlendiğinde de silinir ki silinen mesajlar geri gelmesin.
 */
const cache = new Map();

const keyOf = (roomId) => String(roomId || '');

/** Odanın bellekteki mesaj listesi (yoksa boş liste). */
export function readChatMessages(roomId) {
  return cache.get(keyOf(roomId)) || [];
}

/** Mesaj listesini bellekte sakla. */
export function writeChatMessages(roomId, messages) {
  cache.set(keyOf(roomId), Array.isArray(messages) ? messages : []);
}

/** Odanın bellekteki kopyasını bırak. */
export function clearChatMessages(roomId) {
  cache.delete(keyOf(roomId));
}