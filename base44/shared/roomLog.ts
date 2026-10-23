// Oda kayıt defteri: yönetici işlemleri (koltuktan indirme, odadan atma, yasak kaldırma) sohbete değil buraya yazılır.

const MAX_LOGS = 80;

export function appendRoomLog(room, entry) {
  const logs = Array.isArray(room?.room_logs) ? room.room_logs : [];
  if (!entry?.text) return logs;
  const stamp = new Date().toISOString();
  // Her işlem türü (+ hedef kişi) tek satırda yenilenir: aynı kayıt tekrar tekrar
  // eklenmez, mevcut satır güncellenir.
  const key = entry.log_key || (entry.kind ? `${entry.kind}:${entry.target_id || ''}` : '');
  const fresh = { ...entry, created_at: stamp };
  const rest = key ? logs.filter((log) => (log.log_key || (log.kind ? `${log.kind}:${log.target_id || ''}` : '')) !== key) : logs;
  return [fresh, ...rest].slice(0, MAX_LOGS);
}