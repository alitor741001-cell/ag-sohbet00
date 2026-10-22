import { effectiveVipLevel, isHiddenUser } from './vip.ts';
import { getVipCatalog } from './vipCatalog.ts';
export const VIP_SETTING_KEYS = ['visitors', 'stealth-visit', 'avatar', 'room-privacy'];
export function hasVipPrivilege(user, catalog, key) {
  const feature = catalog.features.find(item => item.key === key);
  return !!feature?.supported && effectiveVipLevel(user) >= feature.minLevel;
}
export async function getVipPreference(base44, ownerId) {
  const rows = await base44.asServiceRole.entities.VipPreference.filter({ owner_id: ownerId }, '-created_date', 1);
  return { stealth_visit: false, hide_room: false, ...rows[0] };
}
export function roomTrackingHidden(user, preference, catalog) {
  return isHiddenUser(user) || (!!preference?.hide_room && hasVipPrivilege(user, catalog, 'room-privacy'));
}
export async function writeVisibleRoom(base44, records, roomId, catalog = null) {
  if (!records.length) return;
  const db = base44.asServiceRole.entities;
  let hidden = new Set();
  if (roomId) {
    const ids = [...new Set(records.map(record => record.user_id))];
    const [users, prefs, rules] = await Promise.all([
      db.User.filter({ id: { $in: ids } }, '-created_date', ids.length),
      db.VipPreference.filter({ owner_id: { $in: ids } }, '-created_date', ids.length),
      catalog ? Promise.resolve(catalog) : getVipCatalog(base44),
    ]);
    hidden = new Set(users.filter(user => roomTrackingHidden(user, prefs.find(pref => pref.owner_id === user.id), rules)).map(user => user.id));
  }
  await db.UserPresence.bulkUpdate(records.map(record => ({ id: record.id, current_room_id: hidden.has(record.user_id) ? '' : roomId || '' })));
}