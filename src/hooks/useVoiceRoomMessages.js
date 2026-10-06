import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { mergeMessages, upsertMessage } from '@/lib/realtimeMessages';

// Only this room is applied to the UI. A burst is committed once per frame.
export default function useVoiceRoomMessages(roomId, setMessages) {
  useEffect(() => {
    if (!roomId) return;
    let alive = true;
    let timer = null;
    const pending = [];
    setMessages([]);
    base44.entities.RoomMessage.filter({ room_id: roomId }, '-created_date', 80)
      .then((items) => { if (alive) setMessages((current) => mergeMessages(current, [...items].reverse())); })
      .catch(() => {});
    const flush = () => {
      timer = null;
      const events = pending.splice(0);
      if (!alive) return;
      setMessages((current) => events.reduce((items, event) => {
        const id = event.data?.id || event.id;
        return event.type === 'delete'
          ? (items.some((item) => item.id === id) ? items.filter((item) => item.id !== id) : items)
          : upsertMessage(items, { ...event.data, id });
      }, current));
    };
    const off = subscribeEntity('RoomMessage', (event) => {
      if (event.type !== 'delete' && event.data?.room_id !== roomId) return;
      if (event.type === 'delete' && event.data?.room_id && event.data.room_id !== roomId) return;
      pending.push(event);
      if (timer === null) timer = window.setTimeout(flush, 16);
    });
    return () => { alive = false; off(); window.clearTimeout(timer); pending.length = 0; };
  }, [roomId, setMessages]);
}