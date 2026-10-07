/**
 * Oda sohbeti giriş anı: odaya girmeden önce yazılmış eski mesajlar hiç gösterilmez.
 * Giriş anı oda + kullanıcı bazında oturum boyunca saklanır, böylece sohbet paneli
 * kapatılıp açıldığında o ana kadar gelen mesajlar ekranda kalır.
 * Her oda kendi kaydını tutar: bir odanın sohbet akışı diğer odaya karışmaz.
 */
const entries = new Map();

const keyOf = (roomId, userId) => `${roomId}:${userId || ''}`;

export function chatEntryAt(roomId, userId) {
  const key = keyOf(roomId, userId);
  let at = entries.get(key);
  if (!at) { at = Date.now(); entries.set(key, at); }
  return at;
}

/** Odadan çıkınca çağrılır: yeniden girildiğinde sohbet sıfırdan akar. */
export function clearChatEntry(roomId, userId) {
  entries.delete(keyOf(roomId, userId));
}