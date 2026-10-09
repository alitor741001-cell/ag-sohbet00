import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  TIMERS,
  assignRoles,
  hasAction,
  isKaranlik,
  resolveNight,
  tallyVotes,
  winnerOf,
} from '../../shared/mafyaEngine.ts';

// ÇEYREK MAFYA: 4-8 kişilik sosyal çıkarım oyunu. Sunucu tek yetkilidir:
// roller gizli kayıtta tutulur, aşamalar zamanla veya herkes hazır olunca ilerler.

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_LIMIT = 20;
const CHAT_LIMIT = 60;
const STALE_MS = 45 * 60 * 1000;
const MAX_CHAT = 240;

const isoIn = (ms) => new Date(Date.now() + ms).toISOString();
const roomName = (user) => user.full_name || user.username || 'Oyuncu';
const playersOf = (room) => (Array.isArray(room?.players) ? room.players : []);
const aliveOf = (room) => playersOf(room).filter((player) => player.alive !== false);
const rolesOf = (secret) => (Array.isArray(secret?.roles) ? secret.roles : []);
const actionsOf = (secret) => (Array.isArray(secret?.actions) ? secret.actions : []);
const notesOf = (secret) => (Array.isArray(secret?.notes) ? secret.notes : []);
const votesOf = (secret) => (Array.isArray(secret?.votes) ? secret.votes : []);
const usedOf = (secret) => (Array.isArray(secret?.komiser_used) ? secret.komiser_used : []);
const roleOf = (secret, userId) => rolesOf(secret).find((entry) => entry.user_id === userId)?.role || '';

function newCode() {
  let out = '';
  for (let i = 0; i < 4; i += 1) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

const newPlayer = (user, seat) => ({
  user_id: user.id,
  name: roomName(user),
  avatar: user.avatar || '',
  seat,
  alive: true,
  ready: false,
  voted: false,
  role: '',
});

const roomView = (room) => ({
  id: room.id,
  code: room.code,
  name: room.name,
  status: room.status,
  round_no: room.round_no || 0,
  phase_ends_at: room.phase_ends_at || '',
  capacity: room.capacity || MAX_PLAYERS,
  host_id: room.host_id || '',
  host_name: room.host_name || '',
  players: playersOf(room),
  last_votes: Array.isArray(room.last_votes) ? room.last_votes : [],
  winner_side: room.winner_side || '',
  final_shown: !!room.final_shown,
  last_action: room.last_action || '',
  has_password: !!room.password,
});

async function findRoom(base44, id) {
  if (!id) return null;
  const rows = await base44.asServiceRole.entities.MafyaRoom.filter({ id }, '-created_date', 1);
  return rows[0] || null;
}

async function findSecret(base44, roomId) {
  const rows = await base44.asServiceRole.entities.MafyaSecret.filter({ room_id: roomId }, '-created_date', 1);
  return rows[0] || null;
}

/** Oyuncunun içinde bulunduğu, bitmemiş oda. */
async function roomOfUser(base44, userId) {
  const rows = await base44.asServiceRole.entities.MafyaRoom.filter({}, '-updated_date', 30);
  return rows.find((room) => room.status !== 'finished' && playersOf(room).some((player) => player.user_id === userId)) || null;
}

async function systemMessage(base44, room, text) {
  await base44.asServiceRole.entities.MafyaChat.create({
    room_id: room.id,
    round_no: room.round_no || 0,
    phase: room.status || 'waiting',
    text,
    type: 'system',
  }).catch(() => null);
}

async function recentChat(base44, roomId) {
  const rows = await base44.asServiceRole.entities.MafyaChat.filter({ room_id: roomId }, '-created_date', CHAT_LIMIT).catch(() => []);
  return rows.slice().reverse().map((row) => ({
    id: row.id,
    user_id: row.user_id || '',
    name: row.name || '',
    text: row.text,
    type: row.type || 'user',
    round_no: row.round_no || 0,
    created_date: row.created_date,
  }));
}

const freshPlayers = (players) => players.map((player) => ({ ...player, ready: false, voted: false }));
const withRoles = (players, secret) => players.map((player) => ({ ...player, role: roleOf(secret, player.user_id) }));

/** Oyunu başlatır: rolleri dağıtır ve rol gösterme aşamasına geçer. */
async function startGame(base44, room) {
  const players = playersOf(room);
  const roles = assignRoles(players);
  const secret = await findSecret(base44, room.id);
  const secretPatch = { round_no: 1, roles, actions: [], notes: [], votes: [], komiser_used: [] };
  if (secret) await base44.asServiceRole.entities.MafyaSecret.update(secret.id, secretPatch);
  else await base44.asServiceRole.entities.MafyaSecret.create({ room_id: room.id, ...secretPatch });

  const patch = {
    status: 'reveal',
    round_no: 1,
    phase_ends_at: isoIn(TIMERS.reveal),
    winner_side: '',
    final_shown: false,
    last_votes: [],
    last_action: 'Roller dağıtıldı.',
    players: players.map((player) => ({ ...player, alive: true, ready: false, voted: false, role: '' })),
  };
  const updated = await base44.asServiceRole.entities.MafyaRoom.update(room.id, patch);
  await systemMessage(base44, updated, 'Roller dağıtıldı: rolünü kimseye gösterme!');
  return updated;
}

async function createRoom(base44, user, form) {
  const capacity = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Math.round(Number(form.capacity) || MAX_PLAYERS)));
  const room = await base44.asServiceRole.entities.MafyaRoom.create({
    code: newCode(),
    name: String(form.name || '').trim().slice(0, 24) || `${roomName(user)} Odası`,
    password: String(form.password || '').trim().slice(0, 12),
    capacity,
    host_id: user.id,
    host_name: roomName(user),
    status: 'waiting',
    round_no: 0,
    phase_ends_at: '',
    players: [newPlayer(user, 0)],
  });
  await base44.asServiceRole.entities.MafyaSecret.create({
    room_id: room.id,
    round_no: 0,
    roles: [],
    actions: [],
    notes: [],
    votes: [],
    komiser_used: [],
  });
  await systemMessage(base44, room, `${roomName(user)} odayı kurdu. En az ${MIN_PLAYERS} kişi olunca oyun başlar.`);
  return room;
}

/** Odaya katılır; oda dolduysa oyun kendiliğinden başlar. */
async function joinRoom(base44, room, user, password) {
  if ((room.password || '') && String(password || '') !== room.password) {
    return { error: 'Oda şifresi yanlış.', status: 400 };
  }
  const other = await roomOfUser(base44, user.id);
  if (other && other.id !== room.id) await removePlayer(base44, other, user.id);

  const players = [...playersOf(room), newPlayer(user, playersOf(room).length)];
  const full = players.length >= (room.capacity || MAX_PLAYERS);
  const updated = await base44.asServiceRole.entities.MafyaRoom.update(room.id, { players });
  await systemMessage(base44, updated, `${roomName(user)} odaya katıldı.`);
  if (!full) return { room_id: room.id };
  await startGame(base44, { ...updated, players });
  return { room_id: room.id };
}

async function removePlayer(base44, room, userId) {
  const players = playersOf(room).filter((player) => player.user_id !== userId);
  if (!players.length) {
    const secret = await findSecret(base44, room.id);
    if (secret) await base44.asServiceRole.entities.MafyaSecret.delete(secret.id).catch(() => null);
    await base44.asServiceRole.entities.MafyaRoom.delete(room.id).catch(() => null);
    return null;
  }
  const hostLeft = room.host_id === userId;
  const patch = {
    players,
    host_id: hostLeft ? players[0].user_id : room.host_id,
    host_name: hostLeft ? players[0].name : room.host_name,
  };
  const updated = await base44.asServiceRole.entities.MafyaRoom.update(room.id, patch);
  await systemMessage(base44, updated, 'Bir oyuncu odadan ayrıldı.');
  return updated;
}

/** Sıradaki aşamaya geçer: süre dolduysa veya herkes işini bitirdiyse. */
async function stepRoom(base44, room, secret) {
  const status = room.status || 'waiting';
  const alive = aliveOf(room);
  const expired = !room.phase_ends_at || Date.now() >= Date.parse(room.phase_ends_at);

  if (status === 'reveal') {
    if (!expired) return null;
    const round = Math.max(1, room.round_no || 1);
    const patch = {
      status: 'night',
      round_no: round,
      phase_ends_at: isoIn(TIMERS.night),
      players: freshPlayers(playersOf(room)),
      last_action: `Gece ${round} başladı.`,
    };
    const updated = await base44.asServiceRole.entities.MafyaRoom.update(room.id, patch);
    await systemMessage(base44, updated, `GECE ${round}: Herkes gece aksiyonunu seçsin. Gücü olmayan geceyi geçer.`);
    return updated;
  }

  if (status === 'night') {
    const done = alive.length > 0 && alive.every((player) => player.ready);
    if (!expired && !done) return null;
    const round = room.round_no || 1;
    const result = resolveNight({ players: playersOf(room), roles: rolesOf(secret), actions: actionsOf(secret), round });
    const deadIds = new Set(result.deaths);
    const players = playersOf(room).map((player) => ({
      ...player,
      alive: player.alive !== false && !deadIds.has(player.user_id),
      ready: false,
      voted: false,
    }));
    const aliveAfter = players.filter((player) => player.alive !== false);
    const winner = winnerOf(players.map((player) => ({ ...player, role: roleOf(secret, player.user_id) })));
    const shown = !!room.final_shown || aliveAfter.length === 4;
    const patch = {
      players: winner ? withRoles(players, secret) : players,
      status: winner ? 'finished' : 'day',
      phase_ends_at: winner ? '' : isoIn(TIMERS.day),
      winner_side: winner,
      final_shown: shown,
      last_action: result.summary,
    };
    const updated = await base44.asServiceRole.entities.MafyaRoom.update(room.id, patch);
    if (result.notes.length || result.komiserUsed.length) {
      await base44.asServiceRole.entities.MafyaSecret.update(secret.id, {
        notes: [...notesOf(secret), ...result.notes],
        komiser_used: [...new Set([...usedOf(secret), ...result.komiserUsed])],
      }).catch(() => null);
    }
    await systemMessage(base44, updated, result.summary);
    if (winner) {
      await systemMessage(base44, updated, winner === 'karanlik' ? 'KARANLIK TARAF KAZANDI!' : 'ŞEHİR KAZANDI!');
    }
    return updated;
  }

  if (status === 'day') {
    if (!expired) return null;
    const patch = {
      status: 'vote',
      phase_ends_at: isoIn(TIMERS.vote),
      players: freshPlayers(playersOf(room)),
      last_action: 'Oylama başladı.',
    };
    const updated = await base44.asServiceRole.entities.MafyaRoom.update(room.id, patch);
    await base44.asServiceRole.entities.MafyaSecret.update(secret.id, { votes: [] }).catch(() => null);
    await systemMessage(base44, updated, 'OYLAMA BAŞLADI! Kimi gönderelim?');
    return updated;
  }

  if (status === 'vote') {
    const voted = alive.length > 0 && alive.every((player) => player.voted);
    if (!expired && !voted) return null;
    const { rows, eliminated } = tallyVotes(votesOf(secret), playersOf(room));
    const removed = alive.find((player) => player.user_id === eliminated) || null;
    const players = playersOf(room).map((player) => ({
      ...player,
      ready: false,
      voted: false,
      alive: player.alive !== false && player.user_id !== eliminated,
    }));
    const aliveAfter = players.filter((player) => player.alive !== false);
    const winner = winnerOf(players.map((player) => ({ ...player, role: roleOf(secret, player.user_id) })));
    const round = (room.round_no || 1) + 1;
    const shown = !!room.final_shown || aliveAfter.length === 4;
    const text = eliminated
      ? `${removed?.name || 'Bir oyuncu'} oylarla gönderildi.`
      : 'Oylar eşit — kimse gönderilmedi.';
    const patch = {
      players: winner ? withRoles(players, secret) : players,
      status: winner ? 'finished' : 'night',
      round_no: winner ? room.round_no : round,
      phase_ends_at: winner ? '' : isoIn(TIMERS.night),
      winner_side: winner,
      final_shown: shown,
      last_votes: rows,
      last_action: text,
    };
    const updated = await base44.asServiceRole.entities.MafyaRoom.update(room.id, patch);
    await base44.asServiceRole.entities.MafyaSecret.update(secret.id, { votes: [] }).catch(() => null);
    await systemMessage(base44, updated, text);
    if (winner) {
      await systemMessage(base44, updated, winner === 'karanlik' ? 'KARANLIK TARAF KAZANDI!' : 'ŞEHİR KAZANDI!');
    } else {
      await systemMessage(base44, updated, `GECE ${round}: Herkes gece aksiyonunu seçsin.`);
    }
    return updated;
  }

  return null;
}

/** Zamanı gelmiş aşamaları sırayla ilerletir. */
async function advance(base44, room, secret) {
  let current = room;
  for (let guard = 0; guard < 4; guard += 1) {
    const next = await stepRoom(base44, current, secret);
    if (!next) break;
    current = next;
    if (current.status === 'finished') break;
  }
  return current;
}

/** Yalnızca oyuncunun kendisine ait gizli bilgiler. */
function meView(room, secret, user) {
  const player = playersOf(room).find((entry) => entry.user_id === user.id) || null;
  const role = roleOf(secret, user.id);
  const teammates = isKaranlik(role)
    ? rolesOf(secret)
      .filter((entry) => entry.user_id !== user.id && isKaranlik(entry.role))
      .map((entry) => ({ user_id: entry.user_id, role: entry.role, name: playersOf(room).find((p) => p.user_id === entry.user_id)?.name || 'Oyuncu' }))
    : [];
  return {
    user_id: user.id,
    in_room: !!player,
    is_host: room.host_id === user.id,
    role,
    side: role ? (isKaranlik(role) ? 'karanlik' : 'sehir') : '',
    has_action: hasAction(role),
    alive: player ? player.alive !== false : false,
    ready: !!player?.ready,
    voted: !!player?.voted,
    my_action: actionsOf(secret).find((entry) => entry.user_id === user.id && entry.round_no === (room.round_no || 0))?.target_id || '',
    komiser_used: usedOf(secret).includes(user.id),
    teammates,
    notes: notesOf(secret)
      .filter((entry) => entry.user_id === user.id)
      .map((entry) => ({ round_no: entry.round_no || 0, text: entry.text })),
  };
}

async function statePayload(base44, room, user) {
  const secret = await findSecret(base44, room.id);
  const current = secret ? await advance(base44, room, secret) : room;
  const fresh = secret ? await findSecret(base44, current.id) : null;
  return {
    now: Date.now(),
    room: roomView(current),
    me: meView(current, fresh || secret, user),
    chat: await recentChat(base44, current.id),
  };
}

/** Lobideki açık odalar ve oyuncunun odası. */
async function lobbyPayload(base44, user) {
  const rooms = await base44.asServiceRole.entities.MafyaRoom.filter({ status: 'waiting' }, '-created_date', ROOM_LIMIT);
  const stale = rooms.filter((room) => Date.parse(room.updated_date || '') < Date.now() - STALE_MS);
  await Promise.allSettled(stale.slice(0, 3).map((room) => base44.asServiceRole.entities.MafyaRoom.delete(room.id)));
  const open = rooms.filter((room) => {
    const count = playersOf(room).length;
    return count > 0 && count < (room.capacity || MAX_PLAYERS) && !stale.includes(room);
  });
  const mine = await roomOfUser(base44, user.id);
  return { rooms: open.map(roomView), my_room_id: mine?.id || '' };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (error) {
      user = null;
    }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'lobby';

    if (action === 'lobby') return Response.json(await lobbyPayload(base44, user));

    if (action === 'quick') {
      const mine = await roomOfUser(base44, user.id);
      if (mine) return Response.json(await statePayload(base44, mine, user));
      const rooms = await base44.asServiceRole.entities.MafyaRoom.filter({ status: 'waiting' }, '-created_date', ROOM_LIMIT);
      const target = rooms.find((room) => !room.password
        && playersOf(room).length > 0
        && playersOf(room).length < (room.capacity || MAX_PLAYERS));
      const joined = target ? await joinRoom(base44, target, user, '') : { room_id: (await createRoom(base44, user, {})).id };
      if (joined.error) return Response.json({ error: joined.error }, { status: joined.status || 400 });
      const room = await findRoom(base44, joined.room_id);
      return Response.json(await statePayload(base44, room, user));
    }

    if (action === 'create') {
      const mine = await roomOfUser(base44, user.id);
      if (mine) return Response.json(await statePayload(base44, mine, user));
      const room = await createRoom(base44, user, body);
      return Response.json(await statePayload(base44, room, user));
    }

    if (action === 'join') {
      const room = await findRoom(base44, body.room_id);
      if (!room) return Response.json({ error: 'Oda bulunamadı.' }, { status: 404 });
      if (room.status !== 'waiting') return Response.json({ error: 'Bu odada oyun başladı.' }, { status: 400 });
      if (playersOf(room).some((player) => player.user_id === user.id)) {
        return Response.json(await statePayload(base44, room, user));
      }
      if (playersOf(room).length >= (room.capacity || MAX_PLAYERS)) {
        return Response.json({ error: 'Oda dolu.' }, { status: 400 });
      }
      const joined = await joinRoom(base44, room, user, body.password);
      if (joined.error) return Response.json({ error: joined.error }, { status: joined.status || 400 });
      return Response.json(await statePayload(base44, await findRoom(base44, joined.room_id), user));
    }

    if (action === 'leave') {
      const room = await findRoom(base44, body.room_id);
      if (room) {
        const wasPlaying = room.status !== 'waiting';
        await removePlayer(base44, room, user.id);
        // Oyundan çıkan oyuncu ölür; aşama kilitlenmesin diye hazır sayılır.
        if (wasPlaying) {
          const fresh = await findRoom(base44, room.id);
          const secret = fresh ? await findSecret(base44, room.id) : null;
          if (fresh && secret) await advance(base44, fresh, secret);
        }
      }
      return Response.json({ left: true });
    }

    if (action === 'start') {
      const room = await findRoom(base44, body.room_id);
      if (!room) return Response.json({ error: 'Oda bulunamadı.' }, { status: 404 });
      if (room.host_id !== user.id) return Response.json({ error: 'Oyunu oda sahibi başlatır.' }, { status: 403 });
      if (room.status !== 'waiting' && room.status !== 'finished') {
        return Response.json({ error: 'Oyun zaten sürüyor.' }, { status: 400 });
      }
      if (room.status === 'waiting' && playersOf(room).length < MIN_PLAYERS) {
        return Response.json({ error: `En az ${MIN_PLAYERS} oyuncu gerekir.` }, { status: 400 });
      }
      await startGame(base44, room);
      return Response.json(await statePayload(base44, await findRoom(base44, room.id), user));
    }

    if (action === 'night') {
      const room = await findRoom(base44, body.room_id);
      if (!room) return Response.json({ error: 'Oda bulunamadı.' }, { status: 404 });
      if (room.status !== 'night' && room.status !== 'reveal') {
        return Response.json({ error: 'Şu an gece değil.' }, { status: 400 });
      }
      const players = playersOf(room);
      const me = players.find((player) => player.user_id === user.id);
      if (!me || me.alive === false) return Response.json({ error: 'Aksiyon için hayatta olmalısın.' }, { status: 400 });
      const secret = await findSecret(base44, room.id);
      const role = roleOf(secret, user.id);
      const targetId = String(body.target_id || '');

      if (hasAction(role)) {
        if (!targetId) return Response.json({ error: 'Hedef seç.' }, { status: 400 });
        if (targetId === user.id && role !== 'doktor') return Response.json({ error: 'Kendini seçemezsin.' }, { status: 400 });
        const target = players.find((player) => player.user_id === targetId && player.alive !== false);
        if (!target) return Response.json({ error: 'Hedef geçersiz.' }, { status: 400 });
        if (role === 'komiser' && usedOf(secret).includes(user.id)) {
          return Response.json({ error: 'Komiser gücünü kullandın.' }, { status: 400 });
        }
        const kept = actionsOf(secret).filter((entry) => !(entry.user_id === user.id && entry.round_no === (room.round_no || 1)));
        await base44.asServiceRole.entities.MafyaSecret.update(secret.id, {
          actions: [...kept, { user_id: user.id, role, target_id: targetId, round_no: room.round_no || 1 }],
        });
      }

      const patch = { players: players.map((player) => (player.user_id === user.id ? { ...player, ready: true } : player)) };
      await base44.asServiceRole.entities.MafyaRoom.update(room.id, patch);
      return Response.json(await statePayload(base44, await findRoom(base44, room.id), user));
    }

    if (action === 'vote') {
      const room = await findRoom(base44, body.room_id);
      if (!room || room.status !== 'vote') return Response.json({ error: 'Şu an oylama yok.' }, { status: 400 });
      const players = playersOf(room);
      const me = players.find((player) => player.user_id === user.id);
      if (!me || me.alive === false) return Response.json({ error: 'Oy için hayatta olmalısın.' }, { status: 400 });
      const targetId = String(body.target_id || '');
      const target = players.find((player) => player.user_id === targetId && player.alive !== false);
      if (!target || targetId === user.id) return Response.json({ error: 'Geçerli bir oyuncu seç.' }, { status: 400 });
      const secret = await findSecret(base44, room.id);
      const kept = votesOf(secret).filter((entry) => entry.user_id !== user.id);
      await base44.asServiceRole.entities.MafyaSecret.update(secret.id, {
        votes: [...kept, { user_id: user.id, target_id: targetId }],
      });
      await base44.asServiceRole.entities.MafyaRoom.update(room.id, {
        players: players.map((player) => (player.user_id === user.id ? { ...player, voted: true, ready: true } : player)),
      });
      return Response.json(await statePayload(base44, await findRoom(base44, room.id), user));
    }

    if (action === 'chat') {
      const room = await findRoom(base44, body.room_id);
      if (!room) return Response.json({ error: 'Oda bulunamadı.' }, { status: 404 });
      const me = playersOf(room).find((player) => player.user_id === user.id);
      if (!me) return Response.json({ error: 'Bu odada değilsin.' }, { status: 403 });
      const text = String(body.text || '').trim().slice(0, MAX_CHAT);
      if (!text) return Response.json({ error: 'Boş mesaj gönderilmez.' }, { status: 400 });
      if (room.status === 'night') return Response.json({ error: 'Gece sessizliği: gündüz konuşulur.' }, { status: 400 });
      if (me.alive === false) return Response.json({ error: 'Ölüler konuşamaz.' }, { status: 400 });
      await base44.asServiceRole.entities.MafyaChat.create({
        room_id: room.id,
        round_no: room.round_no || 0,
        phase: room.status || 'waiting',
        user_id: user.id,
        name: me.name || roomName(user),
        text,
        type: 'user',
      });
      return Response.json({ ok: true });
    }

    const room = await findRoom(base44, body.room_id || (await roomOfUser(base44, user.id))?.id);
    if (!room) return Response.json({ gone: true });
    return Response.json(await statePayload(base44, room, user));
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}