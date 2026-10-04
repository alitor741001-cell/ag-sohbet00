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
  const presenceRoomId = (presence || []).map((item) => item.current_room_id).find((value) => value) || '';

  // Presences kaydı odasız ya da eski kalabilir: kişinin katılımcı olduğu etkin odalar da taranır.
  const activeRooms = await base44.asServiceRole.entities.Room
    .filter({ status: 'active' }, '-updated_date', 100).catch(() => []);
  const rooms = [...activeRooms];
  if (presenceRoomId && !rooms.some((item: any) => item.id === presenceRoomId)) {
    const current = await base44.asServiceRole.entities.Room.get(presenceRoomId).catch(() => null);
    if (current) rooms.unshift(current);
  }

  // Takma ad + maskeli profil: gerçek isim, fotoğraf ve çerçeve hiçbir yerde görünmez.
  const record = await base44.asServiceRole.entities.User.get(userId).catch(() => null);
  const maskedName = hiddenDisplayName(record || { id: userId });

  let maskedRoomId = '';
  for (const room of rooms) {
    if (!(room.participants || []).some((person: any) => person.user_id === userId)) continue;
    const participants = (room.participants || []).map((person: any) =>
      (person.user_id === userId ? { ...person, name: maskedName, avatar: HIDDEN_AVATAR_URL } : person));
    const seats = (Array.isArray(room.seats) ? room.seats : []).map((seat: any) =>
      (seat.user_id === userId ? { ...seat, name: maskedName, avatar: HIDDEN_AVATAR_URL, frame: '' } : seat));

    await base44.asServiceRole.entities.Room.update(room.id, {
      participants,
      seats,
      ghost_entered_at: new Date().toISOString(),
    }).catch(() => {});
    maskedRoomId = room.id;
  }

  return maskedRoomId || null;
}