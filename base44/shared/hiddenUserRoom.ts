import { HIDDEN_AVATAR_URL, hiddenDisplayName } from './vip.ts';

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

  // Takma ad + maskeli profil: gerçek isim, fotoğraf ve çerçeve hiçbir yerde görünmez.
  const record = await base44.asServiceRole.entities.User.get(userId).catch(() => null);
  const maskedName = hiddenDisplayName(record || { id: userId });
  const participants = (Array.isArray(room.participants) ? room.participants : []).map((person) =>
    (person.user_id === userId ? { ...person, name: maskedName, avatar: HIDDEN_AVATAR_URL } : person));
  const seats = (Array.isArray(room.seats) ? room.seats : []).map((seat) =>
    (seat.user_id === userId ? { ...seat, name: maskedName, avatar: HIDDEN_AVATAR_URL, frame: '' } : seat));

  await base44.asServiceRole.entities.Room.update(roomId, {
    participants,
    seats,
    ghost_entered_at: new Date().toISOString(),
  }).catch(() => {});

  return roomId;
}