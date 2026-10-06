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

/** Kişinin şu an bulunduğu etkin odalar: presence kaydı ve katılım listeleri birlikte taranır. */
async function userActiveRooms(base44: any, userId: string) {
  const presence = await base44.asServiceRole.entities.UserPresence
    .filter({ user_id: userId }, '-created_date', 5).catch(() => []);
  const presenceRoomId = (presence || []).map((item: any) => item.current_room_id).find((value: any) => value) || '';

  const activeRooms = await base44.asServiceRole.entities.Room
    .filter({ status: 'active' }, '-updated_date', 100).catch(() => []);
  const rooms = [...activeRooms];
  if (presenceRoomId && !rooms.some((item: any) => item.id === presenceRoomId)) {
    const current = await base44.asServiceRole.entities.Room.get(presenceRoomId).catch(() => null);
    if (current) rooms.unshift(current);
  }
  return rooms;
}

/**
 * Gizli kullanıcı modu bir odadayken açıldığında kişiyi anında görünmez yapar:
 * katılım kaydı takma ada çevrilir, koltuğundaki isim/avatar/çerçeve silinir ve
 * odaya "gizli kullanıcı girdi" anonsu işaretlenir. Kimlik numarası hiçbir yerde görünmez.
 */
export async function maskUserInCurrentRoom(base44: any, userId: string) {
  if (!userId) return null;
  const rooms = await userActiveRooms(base44, userId);

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
    const recent = (room.recent_participants || []).map((person: any) =>
      (person.user_id === userId ? { ...person, name: maskedName, avatar: HIDDEN_AVATAR_URL } : person));

    await base44.asServiceRole.entities.Room.update(room.id, {
      participants,
      seats,
      ...(Array.isArray(room.recent_participants) ? { recent_participants: recent } : {}),
      // Odanın sahibi gizli kullanıcıysa oda kartındaki gerçek isim de silinir.
      ...(room.owner_id === userId ? { owner_name: maskedName } : {}),
      ghost_entered_at: new Date().toISOString(),
    }).catch(() => {});
    maskedRoomId = room.id;
  }

  // Gizli moddayken kimse hangi yayında olduğunu göremez: canlı oda işaretçisi silinir.
  const presence = await base44.asServiceRole.entities.UserPresence
    .filter({ user_id: userId }, '-created_date', 5).catch(() => []);
  await Promise.all((presence || []).map((row: any) =>
    base44.asServiceRole.entities.UserPresence.update(row.id, { current_room_id: '' }).catch(() => {})));

  return maskedRoomId || null;
}

/**
 * Gizli kullanıcı modu kapatıldığında kişinin gerçek kimliği odalarda canlı geri gelir:
 * katılım, koltuk ve izleyici kayıtlarındaki takma ad gerçek isim, fotoğraf ve çerçeveyle değişir.
 */
export async function restoreUserInRooms(base44: any, userId: string) {
  if (!userId) return null;
  const record = await base44.asServiceRole.entities.User.get(userId).catch(() => null);
  if (!record?.id) return null;
  const name = record.username || record.full_name || 'Kullanıcı';
  const avatar = record.avatar || '';
  const frame = record.profile_frame || '';
  const frameScale = Math.max(50, Math.min(150, Math.round(Number(record.profile_frame_scale) || 100)));
  const rooms = await userActiveRooms(base44, userId);

  let restoredRoomId = '';
  for (const room of rooms) {
    if (!(room.participants || []).some((person: any) => person.user_id === userId)) continue;
    const participants = (room.participants || []).map((person: any) =>
      (person.user_id === userId ? { ...person, name, avatar } : person));
    const seats = (Array.isArray(room.seats) ? room.seats : []).map((seat: any) =>
      (seat.user_id === userId ? { ...seat, name, avatar, frame, frame_scale: frameScale } : seat));
    const recent = (room.recent_participants || []).map((person: any) =>
      (person.user_id === userId ? { ...person, name, avatar } : person));

    await base44.asServiceRole.entities.Room.update(room.id, {
      participants,
      seats,
      ...(Array.isArray(room.recent_participants) ? { recent_participants: recent } : {}),
      ...(room.owner_id === userId ? { owner_name: name } : {}),
    }).catch(() => {});
    restoredRoomId = room.id;
  }

  return restoredRoomId || null;
}