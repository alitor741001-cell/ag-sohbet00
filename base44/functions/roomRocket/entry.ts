import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { ROCKET_TARGETS, ROCKET_PRIZES, rocketPosition, rocketTotal } from '../../shared/roomRocketRules.ts';
import { rocketDayQuery, rocketLeaders, rocketProfiles } from '../../shared/roomRocketRanking.ts';
import { safeErrorResponse } from '../../shared/security.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Oturum gerekli.' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    if (typeof body.room_id !== 'string' || !/^[a-f0-9]{24}$/.test(body.room_id)) return Response.json({ error: 'Geçersiz oda.' }, { status: 400 });
    const sr = base44.asServiceRole.entities;
    const rooms = await sr.Room.filter({ id: body.room_id }, 'created_date', 1);
    const room = rooms[0];
    if (!room) return Response.json({ error: 'Oda bulunamadı.' }, { status: 404 });
    const allowed = user.role === 'admin' || room.owner_id === user.id || (room.shared_users || []).includes(user.id) || (room.participants || []).some(person => person.user_id === user.id);
    if (!allowed) return Response.json({ error: 'Önce odaya katılmalısın.' }, { status: 403 });
    if (room.room_type !== 'voice' && room.voice_mode !== true) return Response.json({ error: 'Sesli oda gerekli.' }, { status: 400 });
    const [total, rounds] = await Promise.all([rocketTotal(base44, room.id), sr.RoomRocketRound.filter({ room_id: room.id }, { sort: '-ordinal', limit: 8 })]);
    let leaders = [];
    if (body.details === true) {
      const query = await rocketDayQuery(base44, room.id, new Date().toISOString());
      leaders = await rocketProfiles(base44, await rocketLeaders(base44, query));
    }
    const history = rounds.items.map(round => ({ level: round.level, cycle: round.cycle, status: round.status, finished_at: round.finished_at, winners: (round.recipients || []).filter(person => person.rank > 0 && !person.unavailable).map(person => ({ rank: person.rank, name: person.name, avatar: person.avatar, amount: person.amount, paid: person.paid })) }));
    const events = rounds.items.map(round => {
      const mine = (round.recipients || []).find(person => person.user_id === user.id && !person.unavailable);
      return { id: round.id, ordinal: round.ordinal, level: round.level, status: round.status, my_award: mine ? { amount: mine.amount, paid: mine.paid === true } : null };
    });
    return Response.json({ ok: true, ...rocketPosition(total), total_coins: total, targets: ROCKET_TARGETS, prizes: ROCKET_PRIZES, leaders: leaders.map(({ rank, name, avatar }) => ({ rank, name, avatar })), history, events });
  } catch (error) {
    return safeErrorResponse(error, 'Roket bilgileri yüklenemedi.');
  }
}