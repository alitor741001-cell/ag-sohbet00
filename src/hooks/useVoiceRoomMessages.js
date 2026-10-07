import { useEffect } from 'react';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { upsertMessage } from '@/lib/realtimeMessages';

/**
 * Odadaki sohbet yalnızca girişten sonra akan mesajları gösterir: odaya girmeden
 * önce yazılmış eski mesajlar hiç yüklenmez, böylece kimse geçmiş sohbeti görmez.
 * Aynı odanın içinde kalındığı sürece yazışma ekranda birikir.
 */
export default function useVoiceRoomMessages(roomId, setMessages) {
  useEffect(() => {
    if (!roomId) return;
    let alive = true;
    let timer = null;
    const pending = [];
    setMessages([]);
    // Yoğun akış tek karede uygulanır: kısa aralıkla gelen mesajlar kaybolmaz.
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