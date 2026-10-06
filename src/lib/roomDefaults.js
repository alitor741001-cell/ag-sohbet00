// Oda kurulumunda girilen bilgiler hatırlanır: bir kez giren kişi bir daha aynı bilgileri
// yazmaz. "Sesli Sohbet Odası Aç" ve "Kendi Odamı Aç" hiçbir şey sorulmadan, kayıtlı
// bilgilerle tek dokunuşta açılır.
const KEYS = {
  film: 'filmkeyfi_room_defaults_film',
  voice: 'filmkeyfi_room_defaults_voice',
};

// Eski sürümden kalan yalnızca-isim kayıtları yeni kayda taşınır.
const LEGACY_NAME_KEYS = {
  film: 'filmkeyfi_roomname_film',
  voice: 'filmkeyfi_roomname_voice',
};

export const FILM_ROOM_DEFAULTS = {
  name: '', youtube_link: '', password: '', max_users: 10,
  chat_enabled: true, voice_enabled: false, hidden: false,
};

export const VOICE_ROOM_DEFAULTS = {
  name: '', password: '', seat_count: 8, hidden: false,
};

/** Kayıtlı bilgileri varsayılanların üzerine bindirir; bozuk kayıt sorun çıkarmaz. */
export function loadRoomDefaults(kind, fallback) {
  if (typeof localStorage === 'undefined') return { ...fallback };
  let saved = {};
  try {
    const raw = JSON.parse(localStorage.getItem(KEYS[kind]) || '{}');
    if (raw && typeof raw === 'object') saved = raw;
  } catch { saved = {}; }
  const merged = { ...fallback, ...saved };
  if (!merged.name) merged.name = localStorage.getItem(LEGACY_NAME_KEYS[kind]) || '';
  return merged;
}

/** Girilen bilgiler kaydedilir: bir sonraki açılışta hiçbir şey sorulmaz. */
export function saveRoomDefaults(kind, values) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEYS[kind], JSON.stringify({ ...loadRoomDefaults(kind, {}), ...values }));
    localStorage.setItem(LEGACY_NAME_KEYS[kind], String(values?.name || ''));
  } catch { /* depolama kapalıysa oda yine açılır */ }
}

/** Bilgiler bir kez girilmiş mi? (Ada göre anlaşılır.) */
export function hasSavedRoom(kind) {
  const fallback = kind === 'voice' ? VOICE_ROOM_DEFAULTS : FILM_ROOM_DEFAULTS;
  return !!loadRoomDefaults(kind, fallback).name;
}