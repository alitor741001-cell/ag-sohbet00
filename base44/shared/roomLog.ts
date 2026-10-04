// Oda kayıt defteri: yönetici işlemleri (koltuktan indirme, odadan atma, yasak kaldırma) sohbete değil buraya yazılır.

const MAX_LOGS = 80;

export function appendRoomLog(room, entry) {
  const logs = Array.isArray(room?.room_logs) ? room.room_logs : [];
  if (!entry?.text) return logs;
  return [{ ...entry, created_at: new Date().toISOString() }, ...logs].slice(0, MAX_LOGS);
}