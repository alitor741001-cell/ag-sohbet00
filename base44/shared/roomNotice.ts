// Oda bildirimleri tek satır üzerinden yenilenir: aynı anahtara sahip eski bildirim
// silinir ve yerine güncel tek satır yazılır. Böylece giriş/çıkış ve yetki
// bildirimleri sohbet panelinde sürekli yeni satır olarak birikmez.
export async function upsertRoomNotice(base44, room_id, notice) {
  if (!room_id || !notice?.key || !notice?.text) return;
  await base44.asServiceRole.entities.RoomMessage.deleteMany({ room_id, notice_key: notice.key }).catch(() => {});
  await base44.asServiceRole.entities.RoomMessage.create({
    room_id,
    notice_key: notice.key,
    user_id: notice.user_id || '',
    user_name: notice.user_name || '',
    user_avatar: notice.user_avatar || '',
    text: notice.text,
    type: 'system',
  }).catch(() => {});
}