import { HIDDEN_DISPLAY_NAME } from './vip.ts';

/**
 * Gizli kullanıcı modu bir odadayken açıldığında kişiyi anında görünmez yapar:
 * katılım kaydı takma ada çevrilir, koltuğundaki isim/avatar/çerçeve silinir ve
 * odaya "gizli kullanıcı girdi" anonsu işaretlenir. Kimlik numarası hiçbir yerde görünmez.
 */
export async function maskUserInCurrentRoom(base44: any, userId: string) {
  if (!userId) return null;
  const presence = await base44.asServiceRole.entities.UserPresence
    .filter({ user_id: userId }, '-created_date', 5).catch(() => []);
  const roomId = (presence || []).map((item) => item.current_room_id).find((value) => value) || '';
  if (!roomId) return null;

  const room = await base44.asServiceRole.entities.Room.get(roomId).catch(() => null);
  if (!room) return null;

  const participants = (Array.isArray(room.participants) ? room.participants : []).map((person) =>
    (person.user_id === userId ? { ...person, name: HIDDEN_DISPLAY_NAME, avatar: '' } : person));
  const seats = (Array.isArray(room.seats) ? room.seats : []).map((seat) =>
    (seat.user_id === userId ? { ...seat, name: HIDDEN_DISPLAY_NAME, avatar: '', frame: '' } : seat));

  await base44.asServiceRole.entities.Room.update(roomId, {
    participants,
    seats,
    ghost_entered_at: new Date().toISOString(),
  }).catch(() => {});

  return roomId;
}