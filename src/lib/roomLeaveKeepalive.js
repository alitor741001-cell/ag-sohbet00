import { appParams } from '@/lib/app-params';

function keepaliveInvoke(functionName, payload) {
  try {
    const { appId } = appParams;
    const token = localStorage.getItem('base44_access_token') || localStorage.getItem('token');
    const url = `/apps/${appId}/functions/${functionName}`;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch { /* ignore — best effort */ }
}

/** Oda çıkışı tarayıcı kapatılsa bile sunucuya ulaşır (keepalive). */
export function leaveRoomKeepalive(roomId) {
  if (!roomId) return;
  keepaliveInvoke('room-presence', { action: 'leave', room_id: roomId });
}

/** Koltuk çıkışı tarayıcı kapatılsa bile sunucuya ulaşır (keepalive). */
export function leaveSeatKeepalive(roomId) {
  if (!roomId) return;
  keepaliveInvoke('voice-room', { action: 'seat-leave', room_id: roomId });
}