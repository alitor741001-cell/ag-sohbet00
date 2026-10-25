export const ROCKET_TARGETS = [1000000, 1500000, 2500000, 5000000];
export const ROCKET_PRIZES = [1000, 750, 500, 250];
const CYCLE = 10000000;

export function rocketPosition(coins) {
  const total = Math.max(0, Math.floor(Number(coins) || 0));
  const cycle = Math.floor(total / CYCLE);
  let progress = total % CYCLE;
  let index = 0;
  while (index < 3 && progress >= ROCKET_TARGETS[index]) progress -= ROCKET_TARGETS[index++];
  return { level: index + 1, progress, target: ROCKET_TARGETS[index], cycle: cycle + 1, completed: cycle * 4 + index };
}

export function rocketBoundary(ordinal) {
  return Math.floor((ordinal - 1) / 4) * CYCLE + ROCKET_TARGETS.slice(0, (ordinal - 1) % 4 + 1).reduce((sum, value) => sum + value, 0);
}

export async function rocketTotal(base44, roomId) {
  const result = await base44.asServiceRole.entities.RoomRocketGift.aggregate({ query: { room_id: roomId }, sum: ['coins'] });
  return Math.max(0, Number(result.rows[0]?.sum_coins) || 0);
}