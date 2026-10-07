import { roomShareLink } from '@/lib/roomShare';

/**
 * Kişinin şu anda yayında olduğu odayı bulur: oda aktif, gizli değil ve kişi gerçekten
 * içinde olmalı. Gizli odalar arkadaşlara görünmez; odadan çıkmış kişinin eski canlı
 * kaydı sayılmaz. Katılım bağlantısı odanın türüne göre (sesli / film) üretilir.
 */
export function findLiveRoom(rooms, personId, roomId) {
  if (!personId || !roomId) return null;
  const room = (rooms || []).find((item) => item.id === roomId && item.status === 'active' && !item.hidden);
  if (!room) return null;
  const inside = [...(room.participants || []), ...(room.seats || [])].some((person) => person.user_id === personId);
  if (!inside) return null;
  return { room, isPublic: !room.password, link: roomShareLink(room.id, room.room_type === 'voice') };
}