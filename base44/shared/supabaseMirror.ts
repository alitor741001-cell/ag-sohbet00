/**
 * Supabase ayna katmanı.
 *
 * Base44 kayıtlarını Supabase'teki ayna tablolarına taşır. Servis anahtarı
 * yalnızca sunucuda tutulur ve önbelleğe alınır; tarayıcıya asla gönderilmez.
 * Aynalama hatası ana işlemi etkilemez: hata sonuca yazılır, çağrı durdurulmaz.
 */

const KEY_TTL_MS = 30 * 60 * 1000;
const PAGE_SIZE = 500;
const MAX_PAGES = 20;
// Son turdan beri değişenler tek istekte alınır: 500, sayfa boyutuyla aynı hizada
// tutulur, yoğun dakikalarda kuyruk taşmaz ve veri bir tur geriden gelmez.
const SINCE_LIMIT = 500;
const BATCH = 2;
// Tam eşitleme dilimlere bölünür: her tur canlı veriyi ve sıradaki dilimi işler.
// Böylece platformun istek sınırı aşılmaz, tüm veri birkaç turda tazelenir.
const SLICE_SIZE = 12;
const SLICE_KEY = 'all:slice';

let authCache = { base: '', key: '', at: 0 };

// Sayısal/sözlü kolonlar PostgREST'e doğru tiple gitmeli: metin gelen değerler çevrilir.
const NUMERIC_COLUMNS = new Set([
  'room_number', 'participant_count', 'max_users', 'seat_count', 'current_time', 'position', 'volume',
  'gift_k', 'k_value', 'total_k', 'min_k', 'score', 'dollars', 'tl_amount', 'coins', 'price', 'amount',
  'level', 'days', 'member_count', 'total_diamonds', 'month_diamonds', 'total_earnings', 'share', 'diamonds',
  'broadcaster_dollars', 'agency_dollars', 'bet', 'auto_at', 'cashout_at', 'payout', 'round_no', 'slot',
  'free_spins', 'lines', 'spins', 'total_won', 'grand', 'loaded_coins', 'gift_sent_k', 'gift_received_k',
  'diamond_month', 'unread_user1', 'unread_user2', 'xp', 'message_count', 'sort_order', 'seat_index',
  'crash_at', 'rocket_bet', 'rocket_bet_2',
]);

const BOOLEAN_COLUMNS = new Set([
  'hidden', 'is_playing', 'voice_mode', 'voice_enabled', 'is_personal', 'chat_enabled',
  'online', 'read', 'active', 'muted', 'speaking', 'locked', 'is_banned', 'is_suspended', 'hidden_user',
]);

const ROOM_COLUMNS = ['name', 'owner_id', 'owner_name', 'room_type', 'status', 'hidden', 'room_number', 'movie_id', 'movie_title', 'is_playing', 'voice_mode', 'voice_enabled', 'participant_count', 'is_personal', 'max_users', 'seat_count', 'personal_room_code', 'chat_enabled', 'current_time', 'last_sync'];
const PARTICIPANT_COLUMNS = ['room_id', 'user_id', 'name', 'avatar', 'muted', 'speaking', 'joined_at'];
const SEAT_COLUMNS = ['room_id', 'seat_index', 'user_id', 'name', 'avatar', 'frame', 'locked', 'muted'];

/** Canlı ayna: sık değişen veriler. 'full' her turda tamamen okunur, 'since' son turdan beri değişenler. */
export const LIVE_COLLECTIONS = [
  { entity: 'Room', table: 'rooms', columns: ROOM_COLUMNS, live: 'full', deriveRooms: true },
  { entity: 'RoomMessage', table: 'room_messages', columns: ['room_id', 'user_id', 'user_name', 'user_avatar', 'text', 'file_url', 'gift', 'gift_to_id', 'gift_to_name', 'gift_emoji', 'gift_k', 'type'], live: 'since' },
  { entity: 'RoomMusic', table: 'room_music', columns: ['room_id', 'owner_id', 'owner_name', 'title', 'file_uri', 'url', 'is_playing', 'position', 'started_at', 'volume'], live: 'since' },
  { entity: 'RoomTyping', table: 'room_typing', columns: ['room_id', 'user_id', 'user_name'], live: 'since' },
  { entity: 'UserPresence', table: 'user_presence', columns: ['user_id', 'online', 'last_seen', 'current_room_id'], live: 'since' },
  { entity: 'Conversation', table: 'conversations', columns: ['user1_id', 'user2_id', 'last_message_text', 'last_message_at', 'last_sender_id', 'unread_user1', 'unread_user2', 'typing_user_id', 'members'], live: 'since' },
  { entity: 'DirectMessage', table: 'direct_messages', columns: ['friendship_id', 'sender_id', 'sender_name', 'recipient_id', 'recipient_name', 'text', 'file_url', 'participants'], live: 'since' },
  { entity: 'Notification', table: 'notifications', columns: ['user_id', 'title', 'body', 'type', 'read', 'link', 'ref_id'], live: 'since' },
  { entity: 'Friendship', table: 'friendships', columns: ['requester_id', 'requester_name', 'recipient_id', 'recipient_name', 'status', 'typing_user_id', 'members', 'blocked_by'], live: 'since' },
  { entity: 'RocketLive', table: 'rocket_live', columns: ['key', 'round_no', 'status', 'crash_at', 'phase_ends_at'], live: 'full' },
  { entity: 'User', table: 'app_users', columns: ['full_name', 'email', 'username', 'member_id', 'avatar', 'role', 'gender', 'title', 'display_role', 'vip_level', 'membership_status', 'hidden_user', 'loaded_coins', 'gift_sent_k', 'gift_received_k', 'is_banned', 'is_suspended', 'agency_code', 'agency_name', 'owned_agency_id', 'diamond_month', 'profile_frame', 'special_frame_id', 'last_login'], live: 'full' },
];

/** Tam ayna: canlı veriler + ekonomi, oyun, ajans, destek ve katalog kayıtları. */
export const ALL_COLLECTIONS = [
  ...LIVE_COLLECTIONS,
  { entity: 'RoomTrack', table: 'room_tracks', columns: ['room_id', 'title', 'file_uri', 'added_by', 'added_by_name'] },
  { entity: 'RoomMod', table: 'room_mods', columns: ['room_id', 'user_id'] },
  { entity: 'RoomLevel', table: 'room_levels', columns: ['room_id'] },
  { entity: 'RoomSecret', table: 'room_secrets', columns: ['room_id'] },
  { entity: 'ChatMessage', table: 'chat_messages', columns: ['room_id', 'user_id'] },
  { entity: 'UserXp', table: 'user_xp', columns: ['user_id', 'user_name', 'xp', 'message_count'] },
  { entity: 'UserSession', table: 'user_sessions', columns: ['user_id'] },
  { entity: 'SecurityLog', table: 'security_logs', columns: ['user_id'] },
  { entity: 'FriendshipProgression', table: 'friendship_progressions', columns: ['user_id'] },
  { entity: 'DmTyping', table: 'dm_typing', columns: ['user_id', 'friendship_id'] },
  { entity: 'Report', table: 'reports', columns: ['reporter_id', 'target_id', 'status'] },
  { entity: 'DirectCall', table: 'direct_calls', columns: ['caller_id', 'callee_id', 'status'] },
  { entity: 'SupportTicket', table: 'support_tickets', columns: ['user_id', 'status'] },
  { entity: 'SupportMessage', table: 'support_messages', columns: ['ticket_id', 'user_id'] },
  { entity: 'Gift', table: 'gifts', columns: ['name', 'emoji', 'image_url', 'k_value', 'category', 'sort_order', 'active'] },
  { entity: 'GiftTier', table: 'gift_tiers', columns: ['name', 'min_k', 'active'] },
  { entity: 'GiftSend', table: 'gift_sends', columns: ['room_id', 'sender_id', 'sender_name', 'recipient_id', 'recipient_name', 'gift_id', 'gift_name', 'k_value', 'total_k', 'mode', 'status'] },
  { entity: 'BigGiftAlert', table: 'big_gift_alerts', columns: ['room_id', 'sender_id', 'recipient_id', 'gift_name', 'score'] },
  { entity: 'GiftTransfer', table: 'gift_transfers', columns: ['kind', 'status', 'sender_id', 'recipient_id', 'dollars', 'tl_amount', 'coins'] },
  { entity: 'CoinRequest', table: 'coin_requests', columns: ['user_id', 'user_name', 'coins', 'price', 'status', 'package_name'] },
  { entity: 'CoinGrant', table: 'coin_grants', columns: ['admin_id', 'user_id', 'user_name', 'amount', 'status'] },
  { entity: 'VipItem', table: 'vip_items', columns: ['owner_id', 'level', 'days', 'status', 'sender_id', 'recipient_id'] },
  { entity: 'Payment', table: 'payments', columns: ['user_id', 'amount', 'status'] },
  { entity: 'PaymentMethod', table: 'payment_methods', columns: ['user_id'] },
  { entity: 'GameWallet', table: 'game_wallets', columns: ['user_id', 'user_name', 'coins', 'bet', 'rocket_bet', 'rocket_bet_2', 'grand', 'free_spins', 'lines', 'spins', 'total_won'] },
  { entity: 'GameSpin', table: 'game_spins', columns: ['user_id'] },
  { entity: 'RocketRound', table: 'rocket_rounds', columns: ['round_no', 'status'] },
  { entity: 'RocketBet', table: 'rocket_bets', columns: ['round_id', 'round_no', 'user_id', 'user_name', 'slot', 'bet', 'auto_at', 'status', 'cashout_at', 'payout'] },
  { entity: 'Agency', table: 'agencies', columns: ['agency_id', 'name', 'owner_id', 'owner_name', 'member_count', 'total_diamonds', 'month_diamonds', 'total_earnings', 'status', 'active'] },
  { entity: 'AgencyInvite', table: 'agency_invites', columns: ['agency_record_id', 'owner_id', 'invitee_id', 'kind', 'status', 'share'] },
  { entity: 'AgencyTransfer', table: 'agency_transfers', columns: ['user_id', 'to_agency_id', 'from_agency_id', 'status'] },
  { entity: 'QuotaReward', table: 'quota_rewards', columns: ['user_id', 'agency_owner_id', 'tier_id', 'diamonds', 'amount', 'status', 'period', 'kind'] },
  { entity: 'QuotaTier', table: 'quota_tiers', columns: ['diamonds', 'broadcaster_dollars', 'agency_dollars', 'active'] },
  { entity: 'Movie', table: 'movies', columns: ['title', 'video_id'] },
  { entity: 'Package', table: 'packages', columns: ['name', 'active'] },
  { entity: 'AppConfig', table: 'app_config', columns: ['key'] },
  { entity: 'UpdateAnnouncement', table: 'update_announcements', columns: [] },
  { entity: 'AdminLog', table: 'admin_logs', columns: ['user_id'] },
  { entity: 'TelegramLog', table: 'telegram_logs', columns: [] },
  { entity: 'PushSubscription', table: 'push_subscriptions', columns: ['user_id'] },
  { entity: 'RateLimit', table: 'rate_limits', columns: ['user_id'] },
  { entity: 'XpSettings', table: 'xp_settings', columns: [] },
  { entity: 'XpFrame', table: 'xp_frames', columns: [] },
  { entity: 'SpecialFrame', table: 'special_frames', columns: [] },
];

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Servis anahtarı yönetim API'sinden bir kez alınır ve yarım saat önbellekte kalır. */
async function supabaseAuth(base44) {
  if (authCache.base && authCache.key && Date.now() - authCache.at < KEY_TTL_MS) return authCache;
  const connection = await base44.asServiceRole.connectors.getConnection('supabase');
  const headers = { Authorization: `Bearer ${connection.accessToken}`, 'Content-Type': 'application/json' };
  const projects = await (await fetch('https://api.supabase.com/v1/projects', { headers, signal: AbortSignal.timeout(10000) })).json();
  const ref = Array.isArray(projects) ? projects[0]?.ref : '';
  if (!ref) throw new Error('Supabase projesi bulunamadı');
  const keys = await (await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, { headers, signal: AbortSignal.timeout(10000) })).json();
  const service = (Array.isArray(keys) ? keys : []).find((entry) => entry.name === 'service_role');
  const key = service?.api_key || service?.key || '';
  if (!key) throw new Error('Supabase servis anahtarı alınamadı');
  authCache = { base: `https://${ref}.supabase.co/rest/v1`, key, at: Date.now() };
  return authCache;
}

function coerce(column, value) {
  if (value === undefined || value === null || value === '') return null;
  if (NUMERIC_COLUMNS.has(column)) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  if (BOOLEAN_COLUMNS.has(column)) return value === true || value === 'true' || value === 1;
  return value;
}

function toRow(record, columns) {
  const row = {
    id: String(record.id),
    created_by_id: record.created_by_id || null,
    created_date: record.created_date || null,
    updated_date: record.updated_date || null,
    synced_at: new Date().toISOString(),
    payload: record,
  };
  columns.forEach((column) => { row[column] = coerce(column, record[column]); });
  // Oda satırlarında kişi sayısı katılımcı listesinden hesaplanır.
  if (columns.includes('participant_count')) row.participant_count = (record.participants || []).length;
  return row;
}

export async function upsertRows(base44, table, rows) {
  if (!rows.length) return { ok: true, count: 0 };
  const auth = await supabaseAuth(base44);
  const response = await fetch(`${auth.base}/${table}`, {
    method: 'POST',
    headers: {
      apikey: auth.key,
      Authorization: `Bearer ${auth.key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) return { ok: false, count: 0, error: String(await response.text()).slice(0, 200) };
  return { ok: true, count: rows.length };
}

/**
 * Aynadan satır okur: sohbet geçmişi ve profiller gibi ağır okumalar Supabase'ten gelir.
 * Ayna erişilemezse null döner, çağıran katman kaynaktan okumaya düşer.
 */
export async function readRows(base44, table, query) {
  try {
    const auth = await supabaseAuth(base44);
    const response = await fetch(`${auth.base}/${table}?${query}`, {
      headers: { apikey: auth.key, Authorization: `Bearer ${auth.key}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Profil özetini aynaya yazar: profil sayfası cüzdan hesabını beklemeden okur.
 * Yalnızca verilen alanlar güncellenir; yazma hatası ana akışı etkilemez.
 */
export async function writeProfileSummary(base44, userId, patch) {
  if (!userId) return false;
  try {
    const auth = await supabaseAuth(base44);
    const row = { user_id: String(userId), synced_at: new Date().toISOString() };
    if (patch?.wallet !== undefined) row.wallet = patch.wallet;
    if (patch?.vip_count !== undefined) row.vip_count = Number(patch.vip_count) || 0;
    if (Object.keys(row).length < 3) return false;
    const response = await fetch(`${auth.base}/profile_summaries`, {
      method: 'POST',
      headers: {
        apikey: auth.key,
        Authorization: `Bearer ${auth.key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify([row]),
      signal: AbortSignal.timeout(10000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Profil özetini aynadan okur; ayna boş ya da erişilemezse null döner. */
export async function readProfileSummary(base44, userId) {
  if (!userId) return null;
  const rows = await readRows(base44, 'profile_summaries', `select=wallet,vip_count,synced_at&user_id=eq.${encodeURIComponent(userId)}&limit=1`);
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

/** Bu turda tazelenmeyen satırları siler: kaynağından silinen veri aynada da kalmaz. */
export async function deleteStale(base44, table, runStart) {
  const auth = await supabaseAuth(base44);
  const response = await fetch(`${auth.base}/${table}?synced_at=lt.${runStart}`, {
    method: 'DELETE',
    headers: { apikey: auth.key, Authorization: `Bearer ${auth.key}`, Prefer: 'return=minimal' },
    signal: AbortSignal.timeout(20000),
  });
  return response.ok;
}

async function readCursor(base44, entity) {
  const auth = await supabaseAuth(base44);
  const response = await fetch(`${auth.base}/sync_state?collection=eq.${entity}&select=last_sync`, {
    headers: { apikey: auth.key, Authorization: `Bearer ${auth.key}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) return null;
  const rows = await response.json();
  return rows?.[0]?.last_sync || null;
}

async function writeCursor(base44, entity, runStart, count) {
  const auth = await supabaseAuth(base44);
  await fetch(`${auth.base}/sync_state`, {
    method: 'POST',
    headers: {
      apikey: auth.key,
      Authorization: `Bearer ${auth.key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify([{ collection: entity, last_sync: runStart, last_count: count, updated_at: runStart }]),
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);
}

/** Tam eşitlemede hangi dilimin işlendiğini saklar: sonraki tur bir sonraki dilime geçer. */
async function readSliceIndex(base44) {
  const auth = await supabaseAuth(base44);
  const response = await fetch(`${auth.base}/sync_state?collection=eq.${encodeURIComponent(SLICE_KEY)}&select=last_count`, {
    headers: { apikey: auth.key, Authorization: `Bearer ${auth.key}` },
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);
  if (!response || !response.ok) return 0;
  const rows = await response.json().catch(() => []);
  return Number(rows?.[0]?.last_count) || 0;
}

async function writeSliceIndex(base44, index) {
  const auth = await supabaseAuth(base44);
  await fetch(`${auth.base}/sync_state`, {
    method: 'POST',
    headers: {
      apikey: auth.key,
      Authorization: `Bearer ${auth.key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify([{ collection: SLICE_KEY, last_sync: new Date().toISOString(), last_count: index, updated_at: new Date().toISOString() }]),
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);
}

async function fetchAll(base44, entity) {
  const records = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const batch = await base44.asServiceRole.entities[entity].list('-created_date', PAGE_SIZE, page * PAGE_SIZE);
    records.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }
  return records;
}

async function fetchSince(base44, entity, since) {
  return base44.asServiceRole.entities[entity].filter({ updated_date: { $gt: since } }, '-updated_date', SINCE_LIMIT);
}

function participantRows(records, columns, idSuffix) {
  return records.map((record) => toRow({ ...record, id: `${record.room_id}:${record[idSuffix]}` }, columns));
}

async function syncCollection(base44, collection, context) {
  // Geçici istek sınırı turu eksik bırakmasın: koleksiyon bir kez daha denenir.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      // Tam okunan koleksiyonlar her turda tazelenir; değişken veriler son turdan beri değişenleri alır.
      let records;
      if (collection.live === 'since') {
        const cursor = await readCursor(base44, collection.entity);
        records = cursor ? await fetchSince(base44, collection.entity, cursor) : await fetchAll(base44, collection.entity);
      } else {
        records = await fetchAll(base44, collection.entity);
      }

      const rows = records.map((record) => toRow(record, collection.columns));
      const written = await upsertRows(base44, collection.table, rows);
      if (!written.ok) throw new Error(written.error || 'yazma hatası');

      context.summary.collections[collection.entity] = rows.length;
      context.summary.rows += rows.length;

      // Katılımcı ve koltuk satırları odadan türetilir: ayrı sorgu gerekmez.
      if (collection.deriveRooms) {
        const people = records.flatMap((room) => (room.participants || []).map((person) => ({ ...person, room_id: room.id, created_by_id: room.created_by_id })));
        const seats = records
          .flatMap((room) => (room.seats || []).map((seat) => ({ ...seat, room_id: room.id, seat_index: seat.index, created_by_id: room.created_by_id })))
          .filter((seat) => seat.seat_index !== undefined);
        await upsertRows(base44, 'room_participants', participantRows(people.filter((person) => person.user_id), PARTICIPANT_COLUMNS, 'user_id'));
        await upsertRows(base44, 'room_seats', seats.map((seat) => toRow({ ...seat, id: `${seat.room_id}:${seat.seat_index}` }, SEAT_COLUMNS)));
        context.prunable.add('room_participants');
        context.prunable.add('room_seats');
      }

      // Yalnızca tamamen okunan tablolar budanabilir: artımlı okunan veri eksiktir, silinemez.
      if (collection.live !== 'since') context.prunable.add(collection.table);
      // İmleç yalnızca artımlı okunan koleksiyonlarda okunur: tam okunanlar için
      // yazmak turu boşuna uzatır.
      if (collection.live === 'since') await writeCursor(base44, collection.entity, context.runStart, records.length);
      return true;
    } catch (error) {
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }
      context.summary.errors.push(`${collection.entity}: ${String(error?.message || error).slice(0, 120)}`);
      return false;
    }
  }
  return false;
}

/**
 * Tek kaydı (veya kayıt listesini) hemen aynaya yazar.
 * Yazma noktalarından çağrılır: mesaj, katılımcı, arkadaşlık gibi veriler
 * tur beklenmeden Supabase'e düşer. Hata ana akışı etkilemez.
 */
export async function mirrorRecord(base44, entity, record) {
  const collection = ALL_COLLECTIONS.find((entry) => entry.entity === entity);
  if (!collection || !record) return false;
  try {
    const items = (Array.isArray(record) ? record : [record]).filter((item) => item && item.id);
    if (!items.length) return false;
    const result = await upsertRows(base44, collection.table, items.map((item) => toRow(item, collection.columns)));
    return result.ok;
  } catch {
    return false;
  }
}

/** Odanın katılımcı ve koltuk satırlarını odadan türetip aynaya yazar. */
export async function mirrorRoomDetail(base44, room) {
  if (!room?.id) return false;
  try {
    const participants = (room.participants || [])
      .filter((person) => person?.user_id)
      .map((person) => toRow({ ...person, room_id: room.id, created_by_id: room.created_by_id, id: `${room.id}:${person.user_id}` }, PARTICIPANT_COLUMNS));
    const seats = (room.seats || [])
      .filter((seat) => seat && seat.index !== undefined)
      .map((seat) => toRow({ ...seat, room_id: room.id, seat_index: seat.index, created_by_id: room.created_by_id, id: `${room.id}:${seat.index}` }, SEAT_COLUMNS));
    const first = await upsertRows(base44, 'room_participants', participants);
    const second = await upsertRows(base44, 'room_seats', seats);
    return first.ok && second.ok;
  } catch {
    return false;
  }
}

/**
 * Aynalamayı çalıştırır.
 * mode 'live': sık değişen veriler (oda, mesaj, arkadaşlık, çevrim içi durum) — hızlı tur.
 * mode 'all': tüm koleksiyonlar; bu turda tazelenmeyen satırlar silinir.
 */
export async function runSync(base44, mode = 'live') {
  const full = mode === 'all';
  const runStart = new Date().toISOString();
  // Canlı veri her turda işlenir; tam eşitlemede sıradaki dilim eklenir.
  let collections = LIVE_COLLECTIONS;
  let sliceIndex = null;
  let sliceTotal = 0;
  if (full) {
    const slices = chunk(ALL_COLLECTIONS.filter((entry) => !LIVE_COLLECTIONS.includes(entry)), SLICE_SIZE);
    sliceTotal = slices.length;
    sliceIndex = (await readSliceIndex(base44)) % sliceTotal;
    collections = [...LIVE_COLLECTIONS, ...slices[sliceIndex]];
    await writeSliceIndex(base44, (sliceIndex + 1) % sliceTotal);
  }
  const context = {
    full,
    runStart,
    prunable: new Set(),
    summary: { mode: full ? 'all' : 'live', runStart, slice: sliceIndex, sliceTotal, collections: {}, rows: 0, pruned: 0, errors: [] },
  };

  for (const batch of chunk(collections, BATCH)) {
    await Promise.allSettled(batch.map((collection) => syncCollection(base44, collection, context)));
  }

  // Silinen kayıtlar aynadan da düşer: yalnızca bu turda tamamen okunan tablolarda.
  for (const batch of chunk([...context.prunable], 4)) {
    await Promise.allSettled(batch.map(async (table) => {
      const ok = await deleteStale(base44, table, runStart);
      if (ok) context.summary.pruned += 1;
    }));
  }

  context.summary.tables = context.prunable.size;
  return context.summary;
}