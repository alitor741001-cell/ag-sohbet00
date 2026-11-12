import { dayStartIso } from './giftBox.ts';
import { HIDDEN_AVATAR_URL, hiddenDisplayName, isHiddenUser } from './vip.ts';
import { ROCKET_PRIZES, rocketBoundary } from './roomRocketRules.ts';

export async function rocketDayQuery(base44, roomId, asOf, cycle = 1) {
  const sr = base44.asServiceRole.entities;
  const { items } = await sr.AppConfig.filter({ key: { $in: ['room_gift_reset_at', 'room_gift_day_reset_at'] } }, { limit: 20 });
  const floor = items.reduce((latest, item) => String(item.value || '').slice(0, 19) > latest ? String(item.value).slice(0, 19) : latest, dayStartIso(new Date(asOf)));
  const range = { $gte: floor, $lte: asOf };
  if (cycle > 1) {
    const previous = await sr.RoomRocketGift.filter({ room_id: roomId, total_after: { $gte: rocketBoundary((cycle - 1) * 4) } }, { sort: 'total_after', limit: 1 });
    if (previous.items[0]) range.$gt = previous.items[0].gift_at;
  }
  return { room_id: roomId, status: 'success', k_value: { $gt: 0 }, created_date: range };
}

export async function rocketProfiles(base44, rows) {
  if (!rows.length) return [];
  const people = await base44.asServiceRole.entities.User.filter({ id: { $in: rows.map(row => row.user_id) } }, '-created_date', rows.length);
  const map = new Map(people.map(person => [person.id, person]));
  return rows.map(row => {
    const person = map.get(row.user_id);
    const hidden = isHiddenUser(person);
    return { ...row, name: hidden ? hiddenDisplayName(person) : person?.username || 'Kullanıcı', avatar: hidden ? HIDDEN_AVATAR_URL : person?.avatar || '', unavailable: !person };
  });
}

export async function rocketLeaders(base44, query) {
  const { rows } = await base44.asServiceRole.entities.GiftSend.aggregate({ query, groupBy: 'sender_id', sum: ['k_value'], sort: '-sum_k_value', limit: 4 });
  return rows.filter(row => row.sender_id).map((row, index) => ({ user_id: row.sender_id, score: Math.round(row.sum_k_value * 1000), rank: index + 1 }));
}

// Reservoir sampling gives every other distinct sender an equal chance, across all pages.
export async function rocketRecipients(base44, roomId, level, asOf, cycle = 1) {
  const query = await rocketDayQuery(base44, roomId, asOf, cycle);
  const top = await rocketLeaders(base44, query);
  const excluded = top.map(row => row.user_id);
  const draw = [];
  let cursor = '';
  let seen = 0;
  for (;;) {
    const page = await base44.asServiceRole.entities.GiftSend.aggregate({ query: { ...query, sender_id: { $nin: excluded, ...(cursor ? { $gt: cursor } : {}) } }, groupBy: 'sender_id', sum: ['k_value'], sort: 'sender_id', limit: 1000 });
    for (const row of page.rows) {
      if (!row.sender_id) continue;
      seen++;
      const entry = { user_id: row.sender_id, score: Math.round(row.sum_k_value * 1000), rank: 0, amount: 100 };
      if (draw.length < 10) draw.push(entry);
      else {
        const random = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
        const slot = Math.floor(random * seen);
        if (slot < 10) draw[slot] = entry;
      }
    }
    if (!page.truncated || !page.rows.length) break;
    cursor = page.rows[page.rows.length - 1].sender_id;
  }
  return rocketProfiles(base44, [...top.map(row => ({ ...row, amount: ROCKET_PRIZES[row.rank - 1] * level })), ...draw]);
}