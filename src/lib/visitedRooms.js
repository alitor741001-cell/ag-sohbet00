const KEY = 'filmkeyfi_visited_rooms_v1';
const MAX = 30;

// Türkiye saatiyle gece 24.00: ana sayfadaki son ziyaretçiler her gün sıfırlanır.
const trDayStart = () => {
  const tr = new Date(Date.now() + 3 * 60 * 60 * 1000);
  tr.setUTCHours(0, 0, 0, 0);
  return new Date(tr.getTime() - 3 * 60 * 60 * 1000).getTime();
};

/** Cihazda tutulan oda geçmişi: bugün girilen odalar en yeni önce listelenir. */
export function readVisitedRooms() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];
    const dayStart = trDayStart();
    const fresh = list.filter((item) => {
      if (!item?.id) return false;
      const stamp = new Date(item.visited_at || 0).getTime();
      return Number.isFinite(stamp) && stamp >= dayStart;
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
      // Yayıncının profili geçmiş kartında görünür: kimliği saklanır, avatar oradan çözülür.
      owner_id: room.owner_id || '',
      owner_avatar: room.owner_avatar || '',
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