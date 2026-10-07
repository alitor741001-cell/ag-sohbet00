/** Özel sohbette paylaşılan yayın kartının işareti: {{ROOM_SHARE|odaKimliği|voice|watch}} */
const ROOM_SHARE_PATTERN = /^\{\{ROOM_SHARE\|([^|}]+)(?:\|(voice|watch))?\}\}$/;

/** Paylaşım işaretini çözer; kart değilse null döner. */
export function parseRoomShareMarker(text) {
  const match = ROOM_SHARE_PATTERN.exec(String(text || '').trim());
  if (!match) return null;
  return { roomId: match[1], voice: match[2] !== 'watch' };
}

/** Paylaşılan yayının katılım bağlantısı. */
export function roomShareLink(roomId, voice = true) {
  return voice ? `/sesli-oda/${roomId}` : `/oda/${roomId}`;
}