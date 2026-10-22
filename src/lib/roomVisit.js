const KEY = 'ag-room-visit-v1';
export function roomVisitId(roomId) {
  const old = JSON.parse(sessionStorage.getItem(KEY) || 'null');
  if (old?.roomId === roomId) return old.id;
  const id = crypto.randomUUID();
  sessionStorage.setItem(KEY, JSON.stringify({ roomId, id }));
  return id;
}
export function endRoomVisit(roomId) {
  const old = JSON.parse(sessionStorage.getItem(KEY) || 'null');
  if (old?.roomId === roomId) sessionStorage.removeItem(KEY);
}