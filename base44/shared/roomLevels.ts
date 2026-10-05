export const validRoomLevel = (value) => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 1000;
const bounded = (value) => Math.min(1000, Math.max(1, Math.floor(Number(value) || 1)));
const LEVEL_FRAMES = [[1000, 'lvl_max'], [750, 'lvl_750'], [500, 'lvl_500'], [250, 'lvl_250'], [150, 'lvl_150'], [75, 'lvl_75']];
export const isFixedMaxLevel = (user) => user?.role === 'admin' || ['founder', 'queen_admin', 'admin_helper'].includes(user?.display_role || '');
export const levelFrameFor = (level) => LEVEL_FRAMES.find(([minimum]) => bounded(level) >= minimum)?.[1] || '';

async function applyAutomaticLevelFrame(base44, user, level) {
  const frame = levelFrameFor(level);
  if (!frame) return;
  const unlocked = [...new Set([...(user.unlocked_profile_frames || []), frame])];
  const updates: any = { unlocked_profile_frames: unlocked };
  if (!user.profile_frame || user.profile_frame.startsWith('lvl_')) updates.profile_frame = frame;
  await base44.asServiceRole.entities.User.update(user.id, updates);
}

// Legacy owner-specific records are not global levels. The newest self-owned record
// is canonical, matching the existing message service without deleting history.
export async function getRoomLevel(base44, userId) {
  const rows = await base44.asServiceRole.entities.RoomLevel.filter({ owner_id: userId, user_id: userId }, '-created_date', 1);
  return rows[0] || null;
}

export async function setRoomLevel(base44, target, level) {
  const nextLevel = isFixedMaxLevel(target) ? 1000 : Number(level);
  if (!validRoomLevel(nextLevel)) throw new Error('LVL 1–1000 arasında tam sayı olmalıdır.');
  const current = await getRoomLevel(base44, target.id);
  const data = { owner_id: target.id, user_id: target.id, user_name: target.username || target.full_name || 'Kullanıcı', level: nextLevel, message_count: 0 };
  const saved = current ? await base44.asServiceRole.entities.RoomLevel.update(current.id, data) : await base44.asServiceRole.entities.RoomLevel.create(data);
  await applyAutomaticLevelFrame(base44, target, nextLevel);
  return saved;
}

/**
 * Oda LVL'i mesajla değil hediye atışıyla yükselir: seviye, hediye kutusundaki
 * "atış LVL" basamaklarıyla aynı kaynaktan gelir (gönderilen hediye K toplamı).
 * Gereken hediye eşiği tamamlandığında atlar (örn. 23 → 24).
 * level: hediye gönderiminde hesaplanan yeni atış seviyesi.
 */
export async function syncGiftRoomLevel(base44, { userId, userName, level }) {
  const target = await base44.asServiceRole.entities.User.get(userId).catch(() => null);
  if (!target?.id) return null;
  const fixed = isFixedMaxLevel(target);
  const next = fixed ? 1000 : Math.min(1000, Math.max(1, Math.floor(Number(level) || 0)));
  const current = await getRoomLevel(base44, userId);
  const previous = current ? Math.max(0, Math.floor(Number(current.level) || 0)) : 0;
  const data = { owner_id: userId, user_id: userId, user_name: userName || target.username || target.full_name || 'Kullanıcı', level: next };
  if (current) await base44.asServiceRole.entities.RoomLevel.update(current.id, data);
  else await base44.asServiceRole.entities.RoomLevel.create(data);
  if (levelFrameFor(next) !== levelFrameFor(previous)) await applyAutomaticLevelFrame(base44, target, next);
  return { level: next, previous, leveledUp: !fixed && next > previous };
}