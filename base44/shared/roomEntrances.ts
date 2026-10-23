import { effectiveVipLevel, isHiddenUser } from './vip.ts';
import { getCosmeticSelection, saveCosmeticSelection } from './cosmeticSelection.ts';
import { giftLock } from './supabaseMirror.ts';
export async function publishRoomEntrance(base44, room, user, visitId) {
  const level = effectiveVipLevel(user);
  if (isHiddenUser(user)) return;
  const vip = level >= 5;
  const visit = /^[0-9a-f-]{36}$/i.test(visitId || '') ? visitId : (room.participants || []).find(p => p.user_id === user.id)?.joined_at;
  if (!visit) return;
  const token = crypto.randomUUID();
  if (!await giftLock(base44, [`entrance:${room.id}:${user.id}`, `cosmetics:${user.id}`], token)) return;
  try {
    const sr = base44.asServiceRole.entities;
    const old = await sr.RoomEntranceEvent.filter({ room_id: room.id, user_id: user.id, visit_id: visit }, '-created_date', 1);
    if (old[0]) return;
    const audience_ids = [...new Set((room.participants || []).map(p => p.user_id).filter(Boolean))];
    const name = user.username || user.full_name || 'Kullanıcı';
    // VIP olmayanlar için efektsiz, sade giriş şeridi.
    if (!vip) {
      await sr.RoomEntranceEvent.create({ room_id: room.id, user_id: user.id, visit_id: visit, audience_ids, name, avatar: user.avatar || '', level: 0 });
      return;
    }
    const selection = await getCosmeticSelection(base44, user.id);
    if (selection.entrance_mode === 'off') return;
    let effect;
    if (selection.entrance_mode === 'fixed' && selection.entrance_id) {
      const selected = await sr.CosmeticProduct.get(selection.entrance_id).catch(() => null);
      if (selected?.published && selected.category === 'entrance') effect = selected;
    }
    if (!effect) {
      const count = await sr.CosmeticProduct.count({ published: true, category: 'entrance' });
      if (!count) return;
      const rows = await sr.CosmeticProduct.filter({ published: true, category: 'entrance' }, 'sort_order', Math.min(count, 500));
      const alternatives = rows.filter(p => p.id !== selection.last_entrance_id);
      const pool = alternatives.length ? alternatives : rows;
      effect = pool[Math.floor(Math.random() * pool.length)];
    }
    if (!effect) return;
    await sr.RoomEntranceEvent.create({ room_id: room.id, user_id: user.id, visit_id: visit, audience_ids, name, avatar: user.avatar || '', level, effect_id: effect.id, effect_name: effect.name, image_url: effect.image_url, crop: effect.crop || {}, video_url: effect.video_url || '' });
    await saveCosmeticSelection(base44, user.id, { last_entrance_id: effect.id });
  } finally { await giftLock(base44, [], token, true); }
}