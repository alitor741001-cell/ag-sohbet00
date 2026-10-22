import { effectiveVipLevel } from './vip.ts';
import { syncVipInventory, publishVipAppearance } from './vipInventory.ts';
import { VIP_SETTING_KEYS, hasVipPrivilege, getVipPreference, writeVisibleRoom } from './vipPrivileges.ts';
import { rateLimit } from './security.ts';
export async function handleVipSettings(base44, me, body, catalog) {
  const db = base44.asServiceRole.entities;
  const level = effectiveVipLevel(me);
  const [rows, preference] = await Promise.all([syncVipInventory(base44, me, level, catalog), getVipPreference(base44, me.id)]);
  if (body.action === 'setSetting') {
    if (!['stealth-visit', 'avatar', 'room-privacy'].includes(body.key) || typeof body.enabled !== 'boolean') return Response.json({ error: 'Geçersiz VIP ayarı.' }, { status: 400 });
    if (body.enabled && !hasVipPrivilege(me, catalog, body.key)) return Response.json({ error: 'Bu özellik için geçerli ve yeterli seviyede VIP üyeliği gerekli.' }, { status: 403 });
    const limit = await rateLimit(base44, 'vip-settings:' + me.id, me.id, 30, 60000);
    if (!limit.allowed) return Response.json({ error: 'Biraz bekleyip tekrar deneyin.' }, { status: 429 });
    if (body.key === 'avatar') {
      const row = rows.find(item => item.kind === 'avatar');
      if (row) {
        const patch = { active: body.enabled, ...(body.enabled ? { level } : {}) };
        await db.VipCosmetic.update(row.id, patch); Object.assign(row, patch);
      }
    } else {
      const field = body.key === 'stealth-visit' ? 'stealth_visit' : 'hide_room';
      const patch = { [field]: body.enabled };
      if (preference.id) await db.VipPreference.update(preference.id, patch);
      else Object.assign(preference, await db.VipPreference.create({ owner_id: me.id, ...patch }));
      Object.assign(preference, patch);
      if (body.key === 'room-privacy') {
        const [presence, rooms] = await Promise.all([
          db.UserPresence.filter({ user_id: me.id }, '-created_date', 20),
          body.enabled ? Promise.resolve([]) : db.Room.filter({ 'participants.user_id': me.id, status: 'active', hidden: false }, '-updated_date', 1),
        ]);
        await writeVisibleRoom(base44, presence, body.enabled ? '' : rooms[0]?.id || '', catalog);
      }
    }
  }
  await publishVipAppearance(base44, me, level, rows, catalog);
  const avatar = rows.find(row => row.kind === 'avatar');
  const features = catalog.features.filter(feature => VIP_SETTING_KEYS.includes(feature.key)).map(feature => {
    const available = hasVipPrivilege(me, catalog, feature.key);
    const chosen = feature.key === 'visitors' ? true : feature.key === 'avatar' ? !!avatar?.active && avatar.level <= level : feature.key === 'stealth-visit' ? preference.stealth_visit : preference.hide_room;
    return { key: feature.key, label: feature.label, minLevel: feature.minLevel, available, enabled: available && !!chosen };
  });
  return Response.json({ ok: true, level, expires_at: me.vip_expires_at || '', features });
}