import { HIDDEN_AVATAR_URL, hiddenDisplayName, isHiddenDisplayName } from './vip.ts';

/**
 * Odadaki gizli kullanıcıların katılım ve koltuk kayıtlarını takma ada çevirir.
 * Koltuk ya da katılım kaydı maskeli görünen kişi, odanın her listesinde maskelenir:
 * eski kayıtlarda kalmış gerçek isim, fotoğraf ve çerçeve hiçbir yerde görünmez.
 */
export function maskRoomIdentities(room: any) {
  if (!room) return { room, changed: false };

  const ids = new Set<string>();
  const collect = (person: any) => {
    if (person?.user_id && (isHiddenDisplayName(person.name) || person.avatar === HIDDEN_AVATAR_URL)) ids.add(person.user_id);
  };
  [...(room.participants || []), ...(Array.isArray(room.seats) ? room.seats : [])].forEach(collect);
  if (!ids.size) return { room, changed: false };

  const maskName = (person: any) => (isHiddenDisplayName(person?.name) ? person.name : hiddenDisplayName({ id: person?.user_id }));
  let changed = false;

  const participants = (room.participants || []).map((person: any) => {
    if (!ids.has(person?.user_id) || (isHiddenDisplayName(person.name) && person.avatar === HIDDEN_AVATAR_URL)) return person;
    changed = true;
    return { ...person, name: maskName(person), avatar: HIDDEN_AVATAR_URL };
  });

  const seats = (Array.isArray(room.seats) ? room.seats : []).map((seat: any) => {
    if (!ids.has(seat?.user_id) || (isHiddenDisplayName(seat.name) && seat.avatar === HIDDEN_AVATAR_URL && !seat.frame)) return seat;
    changed = true;
    return { ...seat, name: maskName(seat), avatar: HIDDEN_AVATAR_URL, frame: '' };
  });

  // Oda sahibi gizli kullanıcıysa oda kartında da gerçek isim görünmez.
  const ownerMasked = !!room.owner_id && ids.has(room.owner_id) && !isHiddenDisplayName(room.owner_name);

  return {
    room: {
      ...room,
      participants,
      seats,
      ...(ownerMasked ? { owner_name: maskName({ user_id: room.owner_id, name: room.owner_name }) } : {}),
    },
    changed,
  };
}

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