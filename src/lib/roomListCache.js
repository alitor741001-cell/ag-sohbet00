/**
 * Ana sayfa oda listesi hafızası: sayfalar arasında gidip gelindiğinde liste ve sahip
 * profilleri ağ beklemeden çizilir, canlı akış hafızayı güncel tutar. Hafıza kullanıcıya
 * bağlıdır — başka bir hesapla girildiğinde eski veri gösterilmez.
 */
let cache = { user_id: null, rooms: [], owners: {} };

export const readRoomList = (userId) => (userId && cache.user_id === userId && cache.rooms.length ? cache : null);

export const writeRoomList = (userId, patch) => {
  if (!userId) return;
  if (cache.user_id !== userId) cache = { user_id: userId, rooms: [], owners: {} };
  Object.assign(cache, patch);
};