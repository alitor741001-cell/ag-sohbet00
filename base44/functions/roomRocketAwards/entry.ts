import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { processRoomRockets } from '../../shared/roomRocketProcessor.ts';
import { safeErrorResponse } from '../../shared/security.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Oturum gerekli.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Yetkisiz işlem.' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    if (body.action === 'pending') {
      const pending = await base44.asServiceRole.entities.RoomRocketState.filter({ pending: true }, { sort: 'updated_date', limit: 2 });
      const results = await Promise.all(pending.items.map(async state => {
        const room = await base44.asServiceRole.entities.Room.get(state.room_id);
        return processRoomRockets(base44, room);
      }));
      return Response.json({ ok: true, processed_rooms: results.length });
    }
    if (typeof body.signal_id !== 'string' || !/^[a-f0-9]{24}$/.test(body.signal_id)) return Response.json({ error: 'Geçersiz hediye kaydı.' }, { status: 400 });
    const signals = await base44.asServiceRole.entities.RoomRocketGift.filter({ id: body.signal_id }, 'created_date', 1);
    if (!signals[0]) return Response.json({ error: 'Hediye kaydı bulunamadı.' }, { status: 404 });
    const room = await base44.asServiceRole.entities.Room.get(signals[0].room_id);
    if (room.room_type !== 'voice' && room.voice_mode !== true) return Response.json({ error: 'Sesli oda gerekli.' }, { status: 400 });
    return Response.json(await processRoomRockets(base44, room));
  } catch (error) {
    return safeErrorResponse(error, 'Roket ödülleri işlenemedi.');
  }
}