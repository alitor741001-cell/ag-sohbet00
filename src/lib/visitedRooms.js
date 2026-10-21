const KEY = 'filmkeyfi_visited_rooms_v1';
const MAX = 30;

/** Cihazda tutulan oda geçmişi: girilen odalar en yeni önce listelenir. */
export function readVisitedRooms() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((item) => item?.id) : [];
  } catch {
    return [];
  }
}

/** Odaya girildiğinde çağrılır: aynı oda tek kez, en üstte tutulur. */
export function rememberRoom(room) {
  if (!room?.id) return;
  try {
    const entry = {
      id: room.id,
      name: room.name || 'Oda',
      kind: room.room_type === 'voice' || room.voice_mode === true ? 'voice' : 'film',
      movie_title: room.movie_title || '',
      movie_id: room.movie_id || '',
      owner_name: room.owner_name || '',
      visited_at: new Date().toISOString(),
    };
    const list = readVisitedRooms().filter((item) => item.id !== room.id);
    window.localStorage.setItem(KEY, JSON.stringify([entry, ...list].slice(0, MAX)));
  } catch {
    // Depolama kapalıysa geçmiş tutulmaz; oda girişi etkilenmez.
  }
}

export function clearVisitedRooms() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // yoksayılır
  }
}