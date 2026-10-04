import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { safeErrorResponse } from '../../shared/security.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { room_id } = body || {};
    if (!room_id) return Response.json({ error: 'room_id gerekli' }, { status: 400 });

    const room = await base44.asServiceRole.entities.Room.get(room_id);
    if (!room) return Response.json({ error: 'oda bulunamadı' }, { status: 404 });

    const me = await base44.asServiceRole.entities.User.get(user.id);
    const isMod = me.role === 'admin' || me.role === 'moderator';
    if (room.owner_id !== user.id && !isMod) {
      return Response.json({ error: 'yetkisiz' }, { status: 403 });
    }

    const name = me.username || me.full_name || user.full_name || 'Kullanıcı';
    const res = await base44.asServiceRole.entities.RoomMessage.deleteMany({ room_id });
    // Sohbet temizlendikten sonra kimin temizlediğini belirten tek bir not bırakılır.
    const message = await base44.asServiceRole.entities.RoomMessage.create({
      room_id, user_id: user.id, user_name: name, user_avatar: user.avatar || '',
      text: `${name} cheati temizledi.`, type: 'system'
    });
    return Response.json({ deleted: res?.deleted_count ?? 0, message });
  } catch (e) {
    return safeErrorResponse(e);
  }
}