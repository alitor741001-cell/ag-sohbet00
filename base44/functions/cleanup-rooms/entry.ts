import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const ONLINE_THRESHOLD_MS = 30000; // 30 saniye içinde aktif olan çevrim içi sayılır
const OWNER_OFFLINE_MS = 60000; // oda sahibi 1 dakika çevrim dışı kalırsa oda kapanır

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
    let closedCount = 0;

    for (const room of rooms) {
      const participants = room.participants || [];
      if (participants.length === 0 && !room.is_personal) {
        // Kimsenin olmadığı oda ve sohbeti tamamen silinir.
        await base44.asServiceRole.entities.RoomMessage.deleteMany({ room_id: room.id }).catch(() => {});
        await base44.asServiceRole.entities.Room.delete(room.id).catch(() => {});
        deletedCount++;
        continue;
      }

      // Çevrim içi durum tek sorguda okunur: katılımcılar + oda sahibi.
      const watchedIds = [...new Set([...participants.map((p) => p.user_id), room.owner_id].filter(Boolean))];
      let presenceRecords;
      try {
        presenceRecords = await base44.asServiceRole.entities.UserPresence.filter(
          { user_id: { $in: watchedIds } },
          '-created_date', watchedIds.length
        );
      } catch {
        continue; // durum okunamadı — odayı kapatma (güvenli davranış)
      }
      const latest = {};
      presenceRecords.forEach((rec) => {
        const current = latest[rec.user_id];
        if (!current || new Date(rec.last_seen || 0) > new Date(current.last_seen || 0)) latest[rec.user_id] = rec;
      });
      const onlineWithin = (userId, limit) => {
        const rec = latest[userId];
        return !!rec && rec.online && rec.last_seen && Date.now() - new Date(rec.last_seen).getTime() < limit;
      };

      const hasOnlineParticipant = participants.some((p) => onlineWithin(p.user_id, ONLINE_THRESHOLD_MS));
      const ownerOffline = !onlineWithin(room.owner_id, OWNER_OFFLINE_MS);

      // Kişisel oda: sahibi çevrim dışıysa kapatılır — kayıt silinmez, oda kodu kullanıcıda saklı kalır.
      if (room.is_personal) {
        if (ownerOffline) {
          await base44.asServiceRole.entities.Room.update(room.id, {
            status: 'closed', is_playing: false, participants: [], recent_participants: []
          }).catch(() => {});
          closedCount++;
        }
        continue;
      }

      if (!hasOnlineParticipant || ownerOffline) {
        // Oda sahibi çevrim dışı ya da içeride çevrim içi kimse yok: oda ve sohbeti silinir.
        await base44.asServiceRole.entities.RoomMessage.deleteMany({ room_id: room.id }).catch(() => {});
        await base44.asServiceRole.entities.Room.delete(room.id).catch(() => {});
        deletedCount++;
      }
    }

    return Response.json({ ok: true, checked: rooms.length, deleted: deletedCount, closed: closedCount });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}