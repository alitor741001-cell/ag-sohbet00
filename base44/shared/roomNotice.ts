// Oda bildirimleri kişi başına tek satırdır: aynı anahtara sahip mevcut bildirim
// yerinde güncellenir (konumu ve zamanı korunur), yoksa yeni satır oluşturulur.
// Böylece giriş/çıkış/yetki ve oda eylem bildirimleri sohbet panelinde üst üste birikmez;
// her kişi için tek satır hep en güncel durumu gösterir.
export async function upsertRoomNotice(base44, room_id, notice) {
  if (!room_id || !notice?.key || !notice?.text) return;
  const existing = await base44.asServiceRole.entities.RoomMessage
    .filter({ room_id, notice_key: notice.key }, '-created_date', 1).catch(() => []);
  const row = existing[0];
  if (row) {
    await base44.asServiceRole.entities.RoomMessage.update(row.id, {
      text: notice.text,
      user_id: notice.user_id || row.user_id,
      user_name: notice.user_name || row.user_name,
      user_avatar: notice.user_avatar ?? row.user_avatar,
    }).catch(() => {});
    return;
  }
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