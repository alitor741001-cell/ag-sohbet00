import { giftLock } from './supabaseMirror.ts';
import { rocketBoundary, rocketPosition, rocketTotal } from './roomRocketRules.ts';
import { rocketRecipients } from './roomRocketRanking.ts';
import { payRocketRound } from './roomRocketRewards.ts';
import { announceRocketRound } from './roomRocketAnnouncement.ts';

export async function processRoomRockets(base44, room) {
  const sr = base44.asServiceRole.entities;
  const token = crypto.randomUUID();
  if (!await giftLock(base44, [`room-rocket:${room.id}`], token)) return { more: true, busy: true };
  try {
    await sr.AppLock.updateMany({ token }, { $set: { expires_at: new Date(Date.now() + 330000).toISOString() } });
    const states = await sr.RoomRocketState.filter({ room_id: room.id }, 'created_date', 1);
    let state = states[0] || await sr.RoomRocketState.create({ room_id: room.id, completed: 0, total_coins: 0, audience_ids: [] });
    const total = await rocketTotal(base44, room.id);
    const position = rocketPosition(total);
    const audience = [...new Set([room.owner_id, ...(room.shared_users || []), ...(room.participants || []).map(person => person.user_id)].filter(Boolean))];
    let completed = state.completed || 0;
    // Persist progress first; individual round receipts protect each credit on retries.
    await sr.RoomRocketState.update(state.id, { total_coins: total, audience_ids: audience, pending: completed < position.completed });
    for (let step = 0; completed < position.completed && step < 4; step++) {
      const ordinal = completed + 1;
      const level = (ordinal - 1) % 4 + 1;
      const existing = await sr.RoomRocketRound.filter({ room_id: room.id, ordinal }, 'created_date', 1);
      let round = existing[0];
      if (!round) {
        const crossing = await sr.RoomRocketGift.filter({ room_id: room.id, total_after: { $gte: rocketBoundary(ordinal) } }, { sort: 'total_after', limit: 1 });
        if (!crossing.items[0]) throw new Error('Roketi dolduran hediye bulunamadı.');
        const asOf = crossing.items[0].gift_at;
        const recipients = await rocketRecipients(base44, room.id, level, asOf, Math.floor((ordinal - 1) / 4) + 1);
        round = await sr.RoomRocketRound.create({ room_id: room.id, ordinal, level, cycle: Math.floor((ordinal - 1) / 4) + 1, as_of: asOf, status: 'paying', recipients });
      }
      if (round.status !== 'complete') round = await payRocketRound(base44, round);
      if (round.status !== 'complete') return { ok: true, more: true, completed };
      await announceRocketRound(base44, room, round);
      completed = ordinal;
      state = await sr.RoomRocketState.update(state.id, { completed, total_coins: total, audience_ids: audience, pending: completed < position.completed });
    }
    return { ok: true, ...position, completed, more: completed < position.completed };
  } finally {
    await giftLock(base44, [], token, true);
  }
}