const KEY = 'filmkeyfi_visited_rooms_v1';
const MAX = 30;
// Son ziyaretçiler haftalık sıfırlanır: bir haftadan eski oda kayıtları listeden düşer.
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Cihazda tutulan oda geçmişi: son bir haftada girilen odalar en yeni önce listelenir. */
export function readVisitedRooms() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];
    const now = Date.now();
    const fresh = list.filter((item) => {
      if (!item?.id) return false;
      const stamp = new Date(item.visited_at || 0).getTime();
      return Number.isFinite(stamp) && now - stamp < WEEK_MS;
    });
    if (fresh.length !== list.length) window.localStorage.setItem(KEY, JSON.stringify(fresh));
    return fresh;
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