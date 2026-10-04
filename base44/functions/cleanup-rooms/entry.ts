import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const ONLINE_THRESHOLD_MS = 30000; // 30 saniye içinde aktif olan çevrim içi sayılır

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    // Doğrudan çağrıyı engelle: auth varsa admin olmalı, yoksa (workflow) devam et
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin' && user.role !== 'moderator') {
        return Response.json({ error: 'yetkisiz' }, { status: 403 });
      }
    } catch {
      // auth yok — workflow çağrısı, devam et
    }

    const rooms = await base44.asServiceRole.entities.Room.filter({ status: 'active' }, '-created_date', 500);
    let deletedCount = 0;

    for (const room of rooms) {
      if (room.is_personal) continue; // Kişisel odaları kapatma
      const participants = room.participants || [];
      if (participants.length === 0) {
        // Kimsenin olmadığı oda ve sohbeti tamamen silinir.
        await base44.asServiceRole.entities.RoomMessage.deleteMany({ room_id: room.id }).catch(() => {});
        await base44.asServiceRole.entities.Room.delete(room.id).catch(() => {});
        deletedCount++;
        continue;
      }

      // Her katılımcının çevrim içi durumunu kontrol et
      const onlineParticipantIds = [];
      for (const p of participants) {
        const presence = await base44.asServiceRole.entities.UserPresence.filter({ user_id: p.user_id }, '-created_date', 1).catch(() => []);
        const rec = presence[0];
        if (rec && rec.online && rec.last_seen && Date.now() - new Date(rec.last_seen).getTime() < ONLINE_THRESHOLD_MS) {
          onlineParticipantIds.push(p.user_id);
        }
      }

      if (onlineParticipantIds.length === 0) {
        // Çevrim içi kimse yok — oda ve sohbeti tamamen silinir (sahiplik devredilmez).
        await base44.asServiceRole.entities.RoomMessage.deleteMany({ room_id: room.id }).catch(() => {});
        await base44.asServiceRole.entities.Room.delete(room.id).catch(() => {});
        deletedCount++;
      }
    }

    return Response.json({ ok: true, checked: rooms.length, deleted: deletedCount });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}