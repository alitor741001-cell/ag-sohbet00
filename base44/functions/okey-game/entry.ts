import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';
import { mirrorRecord } from '../../shared/supabaseMirror.ts';
import { loadWallet, nearestBet } from '../../shared/gameWallet.ts';
import { badgeLevels } from '../../shared/userLevels.ts';
import {
  DISCARD_MS,
  DRAW_MS,
  OKEY_BETS,
  TILES_PER_PLAYER,
  autoDiscard,
  dealOkey,
  findDiscard,
  isWild,
  removeOne,
} from '../../shared/okeyEngine.ts';

// 101 OKEY: dört kişilik bahisli masa.
// Bahisler oyun başında cüzdandan düşülür, bitiren oyuncu dört bahsi birden alır.
// Eller ve deste gizli kayıtta (OkeySecret) tutulur; herkes yalnızca kendi elini görür.
const SEATS = 4;
const MAX_DISCARDS = 24;
// Elle başlatmak için gereken en az oyuncu: 2 veya 3 oyuncuyla da oynanır.
const MIN_PLAYERS = 2;
// Yarım saat dolmayan boş masa temizlenir.
const STALE_MS = 30 * 60 * 1000;

const isoIn = (ms: number) => new Date(Date.now() + ms).toISOString();
const newToken = () => crypto.randomUUID();

const emptySeats = () =>
  Array.from({ length: SEATS }, (_, seat) => ({
    seat,
    user_id: '',
    name: '',
    avatar: '',
    level: 0,
    stake: 0,
    tiles: 0,
    left: false,
  }));

function seatsOf(table: any) {
  const list = Array.isArray(table?.seats) ? table.seats.filter(Boolean) : [];
  const base = emptySeats();
  list.forEach((entry: any, index: number) => {
    const seat = Number(entry?.seat);
    const at = Number.isInteger(seat) && seat >= 0 && seat < SEATS ? seat : index;
    base[at] = { ...base[at], ...entry, seat: at };
  });
  return base;
}

const handsOf = (secret: any) => (Array.isArray(secret?.hands) ? secret.hands : []);
const freeSeat = (seats: any[]) => seats.findIndex((seat) => !seat.user_id);
const seatIndex = (seats: any[], userId: string) => seats.findIndex((seat) => seat.user_id === userId);
const potOf = (seats: any[]) => seats.reduce((total, seat) => total + (Number(seat.stake) || 0), 0);
const displayName = (user: any) => user?.username || user?.full_name || 'Oyuncu';

function levelOf(user: any) {
  const badges = badgeLevels(user);
  return badges.vip_level > 0 ? badges.vip_level : badges.n_level;
}

/** Sıradaki oyuncu: ayrılanlar atlanır. */
function nextSeat(seats: any[], from: number) {
  for (let step = 1; step <= SEATS; step += 1) {
    const at = (from + step) % SEATS;
    if (seats[at].user_id && !seats[at].left) return at;
  }
  return from;
}

/** Masada tek etkin oyuncu kaldıysa o oyuncu kazanır. */
function soloWinner(seats: any[]) {
  const active = seats.filter((seat) => seat.user_id && !seat.left);
  const leftCount = seats.filter((seat) => seat.user_id && seat.left).length;
  return active.length === 1 && leftCount > 0 ? active[0] : null;
}

function tableView(table: any) {
  return {
    id: table.id,
    code: table.code || '',
    base_bet: Number(table.base_bet) || OKEY_BETS[0],
    status: table.status || 'waiting',
    pot: Number(table.pot) || 0,
    turn: Number(table.turn) || 0,
    phase: table.phase || '',
    deadline: table.deadline || '',
    gosterge: table.gosterge || '',
    okey: table.okey || '',
    stack_count: Number(table.stack_count) || 0,
    discards: Array.isArray(table.discards) ? table.discards : [],
    seats: seatsOf(table).map((seat) => ({
      seat: seat.seat,
      user_id: seat.user_id || '',
      name: seat.name || '',
      avatar: seat.avatar || '',
      level: Number(seat.level) || 0,
      stake: Number(seat.stake) || 0,
      tiles: Number(seat.tiles) || 0,
      left: !!seat.left,
    })),
    winner_id: table.winner_id || '',
    winner_name: table.winner_name || '',
    win_amount: Number(table.win_amount) || 0,
    last_action: table.last_action || '',
  };
}

async function secretOf(service: any, tableId: string) {
  const found = await service.OkeySecret.filter({ table_id: tableId }, '-created_date', 1);
  return found[0] || null;
}

/** Oyuncunun gördüğü yanıt: masa, kendi eli ve bitirme hakkı. */
async function answer(service: any, table: any, user: any, coins: number) {
  const seats = seatsOf(table);
  const index = seatIndex(seats, user.id);
  const secret = index >= 0 ? await secretOf(service, table.id) : null;
  const hand = handsOf(secret).find((entry: any) => entry.user_id === user.id)?.tiles || [];
  return Response.json({
    table: tableView(table),
    hand,
    seat: index,
    can_finish: hand.length === TILES_PER_PLAYER + 1 && !!findDiscard(hand, table.okey),
    coins,
  });
}

/** Koltuğa oturur ve masa dolduysa oyunu başlatır. */
async function joinSeat(base44: any, service: any, table: any, user: any, coins: number) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const fresh = attempt === 0 ? table : await service.OkeyTable.get(table.id).catch(() => null);
    if (!fresh) return table;
    const seats = seatsOf(fresh);
    if (seatIndex(seats, user.id) >= 0) return fresh;
    const index = freeSeat(seats);
    if (index < 0) return fresh;
    const base = Number(fresh.base_bet) || OKEY_BETS[0];
    seats[index] = {
      seat: index,
      user_id: user.id,
      name: displayName(user),
      avatar: user.avatar || '',
      level: levelOf(user),
      // Bahis taban bahisle başlar; masadayken isteyen kendi bahsini artırabilir.
      stake: base,
      tiles: 0,
      left: false,
    };
    const updated = await service.OkeyTable.update(fresh.id, {
      seats,
      pot: potOf(seats),
      last_action: `${displayName(user)} masaya oturdu`,
    });
    if (seatIndex(seatsOf(updated), user.id) >= 0) return maybeStart(base44, service, updated);
  }
  return table;
}

/** Dört koltuk dolduysa masayı bir kez başlatır (eşzamanlı başlatmaya karşı kilitli). */
async function maybeStart(base44: any, service: any, table: any) {
  const seats = seatsOf(table);
  if (table.status !== 'waiting' || seats.some((seat) => !seat.user_id)) return table;
  const token = newToken();
  await service.OkeyTable.updateMany(
    { id: table.id, status: 'waiting', turn_token: table.turn_token || '' },
    { $set: { turn_token: token } },
  );
  const fresh = await service.OkeyTable.get(table.id);
  if (fresh.turn_token !== token || fresh.status !== 'waiting') return fresh;
  return startGame(base44, service, fresh, seatsOf(fresh), token);
}

/** Dağıtım: bahisler cüzdandan düşülür, eller gizli kayda yazılır. */
async function startGame(base44: any, service: any, table: any, seats: any[], token: string) {
  const deal = dealOkey();
  const pot = potOf(seats);
  await Promise.allSettled(
    seats
      .filter((seat) => seat.user_id)
      .map(async (seat) => {
        const stake = Number(seat.stake) || 0;
        if (stake <= 0) return null;
        const wallet = await loadWallet(base44, {
          id: seat.user_id,
          role: 'user',
          full_name: seat.name,
        }).catch(() => null);
        if (!wallet) return null;
        await service.GameWallet.update(wallet.id, {
          coins: Math.max(0, (wallet.coins ?? 0) - stake),
        });
        return null;
      }),
  );
  const hands = seats.map((seat, index) => ({
    seat: index,
    user_id: seat.user_id,
    tiles: deal.hands[index] || [],
  }));
  await service.OkeySecret.create({
    table_id: table.id,
    okey: deal.okey,
    stack: deal.stack,
    hands,
  });
  const turnPool = seats.map((seat, index) => (seat.user_id && !seat.left ? index : -1)).filter((index) => index >= 0);
  const turn = turnPool.length ? turnPool[Math.floor(Math.random() * turnPool.length)] : 0;
  const updated = await service.OkeyTable.update(table.id, {
    status: 'playing',
    pot,
    // Boş koltuklar taş almaz: masa 2-3 oyuncuyla da oynanabilir.
    seats: seats.map((seat, index) => ({ ...seat, tiles: seat.user_id ? (deal.hands[index] || []).length : 0 })),
    gosterge: deal.gosterge,
    okey: deal.okey,
    stack_count: deal.stack.length,
    discards: [],
    turn,
    phase: 'draw',
    deadline: isoIn(DRAW_MS),
    turn_token: token,
    winner_id: '',
    winner_name: '',
    win_amount: 0,
    round_no: (Number(table.round_no) || 0) + 1,
    last_action: 'Taşlar dağıtıldı',
  });
  return updated;
}

/** Ortadan bir taş çeker. Deste bittiyse el iadeyle kapanır. */
async function drawStep(base44: any, service: any, table: any, secret: any, seat: number, note: string) {
  const seats = seatsOf(table);
  const stack = Array.isArray(secret?.stack) ? [...secret.stack] : [];
  if (!stack.length) return refundTable(base44, service, table, seats);
  const tile = stack.pop() as string;
  const hands = handsOf(secret).map((entry: any) =>
    entry.seat === seat ? { ...entry, tiles: [...(entry.tiles || []), tile] } : entry,
  );
  await service.OkeySecret.update(secret.id, { stack, hands });
  return service.OkeyTable.update(table.id, {
    seats: seats.map((entry, index) =>
      index === seat ? { ...entry, tiles: (Number(entry.tiles) || 0) + 1 } : entry,
    ),
    stack_count: stack.length,
    phase: 'discard',
    deadline: isoIn(DISCARD_MS),
    turn_token: newToken(),
    last_action: note || `${seats[seat].name} ortadan taş çekti`,
  });
}

/** Elinden bir taşı ortaya atar ve sırayı ilerletir. */
async function discardStep(base44: any, service: any, table: any, secret: any, seat: number, tile: string, note: string) {
  const seats = seatsOf(table);
  const hands = handsOf(secret).map((entry: any) =>
    entry.seat === seat ? { ...entry, tiles: removeOne(entry.tiles || [], tile) } : entry,
  );
  const mine = hands.find((entry: any) => entry.seat === seat)?.tiles || [];
  await service.OkeySecret.update(secret.id, { hands });
  const updated = await service.OkeyTable.update(table.id, {
    seats: seats.map((entry, index) => (index === seat ? { ...entry, tiles: mine.length } : entry)),
    discards: [...(Array.isArray(table.discards) ? table.discards : []), tile].slice(-MAX_DISCARDS),
    turn: nextSeat(seats, seat),
    phase: 'draw',
    deadline: isoIn(DRAW_MS),
    turn_token: newToken(),
    last_action: note || `${seats[seat].name} taş attı`,
  });
  const solo = soloWinner(seatsOf(updated));
  return solo ? payWinner(base44, service, updated, seatsOf(updated), solo) : updated;
}

/** Kazanan potun tamamını alır; masa kapanır, eller silinir. */
async function payWinner(base44: any, service: any, table: any, seats: any[], winner: any) {
  const pot = Number(table.pot) || 0;
  if (winner?.user_id && pot > 0) {
    const wallet = await loadWallet(base44, {
      id: winner.user_id,
      role: 'user',
      full_name: winner.name,
    }).catch(() => null);
    if (wallet) {
      const updated = await service.GameWallet.update(wallet.id, {
        coins: (wallet.coins ?? 0) + pot,
        total_won: (wallet.total_won ?? 0) + pot,
        last_spin_at: new Date().toISOString(),
      });
      waitUntil(mirrorRecord(base44, 'GameWallet', updated));
    }
  }
  await service.OkeySecret.deleteMany({ table_id: table.id });
  return service.OkeyTable.update(table.id, {
    status: 'finished',
    pot: 0,
    win_amount: pot,
    winner_id: winner?.user_id || '',
    winner_name: winner?.name || '',
    phase: '',
    deadline: '',
    turn_token: newToken(),
    last_action: winner?.name ? `${winner.name} bitirdi ve ${pot} coin kazandı` : 'El bitti',
  });
}

/** Deste bittiğinde kimse bitiremediyse bahisler iade edilir. */
async function refundTable(base44: any, service: any, table: any, seats: any[]) {
  await Promise.allSettled(
    seats
      .filter((seat) => seat.user_id)
      .map(async (seat) => {
        const stake = Number(seat.stake) || 0;
        if (stake <= 0) return null;
        const wallet = await loadWallet(base44, {
          id: seat.user_id,
          role: 'user',
          full_name: seat.name,
        }).catch(() => null);
        if (!wallet) return null;
        const updated = await service.GameWallet.update(wallet.id, {
          coins: (wallet.coins ?? 0) + stake,
        });
        waitUntil(mirrorRecord(base44, 'GameWallet', updated));
        return null;
      }),
  );
  await service.OkeySecret.deleteMany({ table_id: table.id });
  return service.OkeyTable.update(table.id, {
    status: 'finished',
    pot: 0,
    win_amount: 0,
    winner_id: '',
    winner_name: '',
    phase: '',
    deadline: '',
    turn_token: newToken(),
    last_action: 'Orta bitti — bahisler iade edildi',
  });
}

/** Süresi dolan turu yürütür: yalnızca kilidi alan istemci uygular. */
async function expireTurn(base44: any, service: any, table: any) {
  if (table.status !== 'playing') return table;
  const deadline = Date.parse(table.deadline || '');
  if (!deadline || deadline > Date.now()) return table;
  const seats = seatsOf(table);
  const seat = Number(table.turn) || 0;
  if (!seats[seat]?.user_id || seats[seat].left) {
    const moved = nextSeat(seats, seat);
    return service.OkeyTable.update(table.id, {
      turn: moved,
      phase: 'draw',
      deadline: isoIn(DRAW_MS),
      turn_token: newToken(),
      last_action: 'Sıra ilerledi',
    });
  }
  const token = newToken();
  await service.OkeyTable.updateMany(
    { id: table.id, turn_token: table.turn_token || '' },
    { $set: { turn_token: token } },
  );
  const fresh = await service.OkeyTable.get(table.id);
  if (fresh.turn_token !== token) return fresh;
  const secret = await secretOf(service, fresh.id);
  const hand = handsOf(secret).find((entry: any) => entry.user_id === seats[seat].user_id)?.tiles || [];
  if (fresh.phase === 'discard' && hand.length > TILES_PER_PLAYER) {
    return discardStep(base44, service, fresh, secret, seat, autoDiscard(hand, fresh.okey), 'Süre doldu — taş otomatik atıldı');
  }
  return drawStep(base44, service, fresh, secret, seat, 'Süre doldu — taş ortadan çekildi');
}

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    let user: any = null;
    try {
      user = await base44.auth.me();
    } catch (error) {
      user = null;
    }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'state';
    const service = base44.asServiceRole.entities;
    const wallet = await loadWallet(base44, user);
    const coins = wallet.coins ?? 0;

    // Lobide bekleyen ve oynanan masalar listelenir.
    if (action === 'lobby') {
      const waiting = await service.OkeyTable.filter({ status: 'waiting' }, '-updated_date', 40);
      const stale = waiting.filter(
        (table: any) => Date.now() - Date.parse(table.updated_date || 0) > STALE_MS && !seatsOf(table).some((seat: any) => seat.user_id),
      );
      if (stale.length) await Promise.allSettled(stale.map((table: any) => service.OkeyTable.delete(table.id)));
      const living = waiting.filter((table: any) => stale.indexOf(table) < 0);
      const playing = await service.OkeyTable.filter({ status: 'playing' }, '-updated_date', 12);
      const tables = [...living, ...playing].map(tableView);
      const mine = tables.find((table: any) => (table.seats || []).some((seat: any) => seat.user_id === user.id && !seat.left));
      return Response.json({ coins, bets: OKEY_BETS, tables, my_table_id: mine?.id || '' });
    }

    // Hızlı oyna: seçilen bahiste boş yeri olan rastgele bir masaya oturur, yoksa masa açar.
    if (action === 'quick_join') {
      const bet = nearestBet(Number(body.bet), OKEY_BETS);
      if (coins < bet) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });
      const waiting = await service.OkeyTable.filter({ status: 'waiting' }, '-updated_date', 40);
      const candidates = waiting.filter((table: any) => {
        const seats = seatsOf(table);
        return Number(table.base_bet) === bet && freeSeat(seats) >= 0 && seatIndex(seats, user.id) < 0;
      });
      const picked = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
      const table = picked || (await service.OkeyTable.create({
        code: `${Math.floor(1000 + Math.random() * 9000)}`,
        base_bet: bet,
        status: 'waiting',
        seats: emptySeats(),
        pot: 0,
        turn: 0,
        phase: '',
        deadline: '',
        turn_token: '',
        gosterge: '',
        okey: '',
        stack_count: 0,
        discards: [],
        last_action: `${displayName(user)} masa kurdu`,
      }));
      const joined = await joinSeat(base44, service, table, user, coins);
      return answer(service, joined, user, coins);
    }

    if (action === 'join') {
      const table = await service.OkeyTable.get(body.table_id).catch(() => null);
      if (!table) return Response.json({ error: 'Masa bulunamadı.' }, { status: 404 });
      const seats = seatsOf(table);
      if (seatIndex(seats, user.id) < 0 && freeSeat(seats) < 0) {
        return Response.json({ error: 'Masa dolu.' }, { status: 400 });
      }
      if (seatIndex(seats, user.id) < 0 && coins < (Number(table.base_bet) || 0)) {
        return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });
      }
      const joined = await joinSeat(base44, service, table, user, coins);
      return answer(service, joined, user, coins);
    }

    // Bahis artırma: yalnızca oyun başlamadan, taban bahsin katları kadar.
    if (action === 'stake') {
      const table = await service.OkeyTable.get(body.table_id).catch(() => null);
      if (!table || table.status !== 'waiting') {
        return Response.json({ error: 'Bahis yalnızca oyun başlamadan değiştirilebilir.' }, { status: 400 });
      }
      const seats = seatsOf(table);
      const index = seatIndex(seats, user.id);
      if (index < 0) return Response.json({ error: 'Bu masada değilsin.' }, { status: 400 });
      const base = Number(table.base_bet) || OKEY_BETS[0];
      const steps = Math.max(1, Math.round((Number(body.stake) || 0) / base));
      const stake = Math.min(Math.floor(coins / base), steps) * base;
      if (stake < base) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });
      seats[index] = { ...seats[index], stake };
      const updated = await service.OkeyTable.update(table.id, {
        seats,
        pot: potOf(seats),
        last_action: `${seats[index].name} bahsini ${stake} coine çıkardı`,
      });
      return answer(service, updated, user, coins);
    }

    // Başlat: 4 oyuncu beklemeden, 2 veya 3 oyuncuyla da el başlatılabilir.
    if (action === 'start') {
      const table = await service.OkeyTable.get(body.table_id).catch(() => null);
      if (!table) return Response.json({ error: 'Masa bulunamadı.' }, { status: 404 });
      if (table.status !== 'waiting') return Response.json({ error: 'Oyun zaten başladı.' }, { status: 400 });
      const seats = seatsOf(table);
      const index = seatIndex(seats, user.id);
      if (index < 0) return Response.json({ error: 'Bu masada değilsin.' }, { status: 400 });
      const filled = seats.filter((seat) => seat.user_id).length;
      if (filled < MIN_PLAYERS) {
        return Response.json({ error: `Başlamak için en az ${MIN_PLAYERS} oyuncu gerekli.` }, { status: 400 });
      }
      if (coins < (Number(seats[index].stake) || 0)) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });
      // Kilit: iki oyuncu aynı anda basarsa oyun yalnızca bir kez başlar.
      const token = newToken();
      await service.OkeyTable.updateMany(
        { id: table.id, status: 'waiting', turn_token: table.turn_token || '' },
        { $set: { turn_token: token } },
      );
      const fresh = await service.OkeyTable.get(table.id);
      if (fresh.turn_token !== token || fresh.status !== 'waiting') return answer(service, fresh, user, coins);
      const started = await startGame(base44, service, fresh, seatsOf(fresh), token);
      return answer(service, started, user, coins);
    }

    if (action === 'leave') {
      const table = await service.OkeyTable.get(body.table_id).catch(() => null);
      if (!table) return Response.json({ ok: true });
      const seats = seatsOf(table);
      const index = seatIndex(seats, user.id);
      if (index < 0) return Response.json({ ok: true });
      const empty = { ...seats[index], user_id: '', name: '', avatar: '', level: 0, stake: 0, tiles: 0, left: false };
      if (table.status !== 'playing') {
        seats[index] = empty;
        if (!seats.some((seat) => seat.user_id)) {
          await service.OkeyTable.delete(table.id);
          return Response.json({ ok: true, closed: true });
        }
        await service.OkeyTable.update(table.id, { seats, pot: potOf(seats), last_action: `${table.status === 'finished' ? 'Masa kapandı' : 'Oyuncu ayrıldı'}` });
        return Response.json({ ok: true });
      }
      seats[index] = { ...seats[index], left: true };
      const patch: Record<string, any> = { seats, last_action: `${seats[index].name} oyundan ayrıldı` };
      if (Number(table.turn) === index) {
        patch.turn = nextSeat(seats, index);
        patch.phase = 'draw';
        patch.deadline = isoIn(DRAW_MS);
      }
      const updated = await service.OkeyTable.update(table.id, patch);
      const solo = soloWinner(seatsOf(updated));
      if (solo) await payWinner(base44, service, updated, seatsOf(updated), solo);
      return Response.json({ ok: true });
    }

    if (action === 'draw') {
      const table = await service.OkeyTable.get(body.table_id).catch(() => null);
      if (!table) return Response.json({ error: 'Masa bulunamadı.' }, { status: 404 });
      const seats = seatsOf(table);
      const index = seatIndex(seats, user.id);
      if (table.status !== 'playing' || index < 0 || Number(table.turn) !== index || table.phase !== 'draw') {
        return Response.json({ error: 'Sıra sende değil.' }, { status: 400 });
      }
      const secret = await secretOf(service, table.id);
      if (!secret) return Response.json({ error: 'Masa kapandı.' }, { status: 400 });
      const updated = await drawStep(base44, service, table, secret, index, '');
      return answer(service, updated, user, coins);
    }

    if (action === 'discard') {
      const table = await service.OkeyTable.get(body.table_id).catch(() => null);
      if (!table) return Response.json({ error: 'Masa bulunamadı.' }, { status: 404 });
      const seats = seatsOf(table);
      const index = seatIndex(seats, user.id);
      if (table.status !== 'playing' || index < 0 || Number(table.turn) !== index || table.phase !== 'discard') {
        return Response.json({ error: 'Sıra sende değil.' }, { status: 400 });
      }
      const tile = String(body.tile || '');
      const secret = await secretOf(service, table.id);
      const hand = handsOf(secret).find((entry: any) => entry.user_id === user.id)?.tiles || [];
      if (!tile || hand.indexOf(tile) < 0) return Response.json({ error: 'Bu taş elinde yok.' }, { status: 400 });
      if (isWild(tile, table.okey)) return Response.json({ error: 'Okey atılmaz.' }, { status: 400 });
      const updated = await discardStep(base44, service, table, secret, index, tile, '');
      return answer(service, updated, user, coins);
    }

    // Bitirme: kalan 14 taş geçerliyse taş atılır ve pot kazanılır.
    if (action === 'finish') {
      const table = await service.OkeyTable.get(body.table_id).catch(() => null);
      if (!table) return Response.json({ error: 'Masa bulunamadı.' }, { status: 404 });
      const seats = seatsOf(table);
      const index = seatIndex(seats, user.id);
      if (table.status !== 'playing' || index < 0 || Number(table.turn) !== index || table.phase !== 'discard') {
        return Response.json({ error: 'Sıra sende değil.' }, { status: 400 });
      }
      const secret = await secretOf(service, table.id);
      const hand = handsOf(secret).find((entry: any) => entry.user_id === user.id)?.tiles || [];
      const tile = findDiscard(hand, table.okey);
      if (!tile) {
        return Response.json(
          { error: 'El bitmiyor: kalan 14 taşın tümü seri/per/çift olmalı ve en az bir seri içermeli.' },
          { status: 400 },
        );
      }
      const updated = await discardStep(base44, service, table, secret, index, tile, '');
      const finished = await payWinner(base44, service, updated, seatsOf(updated), seatsOf(updated)[index]);
      return answer(service, finished, user, coins);
    }

    // Durum: masa, kendi eli ve kalan süre. Zaman aşımı burada uygulanır.
    const table = await service.OkeyTable.get(body.table_id).catch(() => null);
    if (!table) return Response.json({ error: 'Masa bulunamadı.' }, { status: 404 });
    let live = table;
    if (live.status === 'waiting') live = await maybeStart(base44, service, live);
    if (live.status === 'playing') live = await expireTurn(base44, service, live);
    return answer(service, live, user, coins);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}