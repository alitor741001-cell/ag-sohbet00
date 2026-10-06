import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';

export default function useRoomTyping(roomId, user) {
  const [names, setNames] = useState([]);
  const sender = useRef(() => {});
  useEffect(() => {
    if (!roomId) return;
    let alive = true, loading = false, busy = false, lastWrite = 0, ownId = null, idleTimer = null;
    const records = new Map();
    const publish = () => {
      if (!alive) return;
      const now = Date.now();
      const next = [...new Set([...records.values()].filter((r) => r.user_id !== user?.id && now - new Date(r.updated_at || r.created_date).getTime() < 3000).map((r) => r.user_name))];
      setNames((prev) => prev.length === next.length && prev.every((name, i) => name === next[i]) ? prev : next);
    };
    const refresh = async () => {
      if (!alive || loading) return;
      loading = true;
      try {
        const list = await base44.entities.RoomTyping.filter({ room_id: roomId }, '-updated_date', 50);
        if (!alive) return;
        records.clear(); list.forEach((record) => records.set(record.id, record)); publish();
      } catch {} finally { loading = false; }
    };
    const removeOwn = () => {
      const id = ownId; ownId = null;
      if (id) base44.entities.RoomTyping.delete(id).catch(() => {});
    };
    sender.current = () => {
      if (!user?.id || !alive) return;
      clearTimeout(idleTimer); idleTimer = setTimeout(removeOwn, 3000);
      if (busy || Date.now() - lastWrite < 1200) return;
      busy = true; lastWrite = Date.now();
      const data = { updated_at: new Date().toISOString() };
      const write = ownId
        ? base44.entities.RoomTyping.update(ownId, data)
        : base44.entities.RoomTyping.create({ room_id: roomId, user_id: user.id, user_name: user.username || user.full_name || 'Kullanıcı', ...data });
      write.then((record) => {
        if (!alive) { if (record?.id) base44.entities.RoomTyping.delete(record.id).catch(() => {}); return; }
        ownId = record?.id || ownId;
      }).catch(() => { ownId = null; lastWrite = 0; }).finally(() => { busy = false; });
    };
    refresh();
    const off = subscribeEntity('RoomTyping', (event) => {
      const id = event.data?.id || event.id;
      if (event.type === 'delete') { if (records.delete(id)) publish(); return; }
      const known = records.get(id);
      if (!known && event.data?.room_id !== roomId) return;
      records.set(id, { ...known, ...event.data, id }); publish();
    });
    const expiry = setInterval(publish, 1000);
    const poll = setInterval(() => { if (document.visibilityState !== 'hidden') refresh(); }, 15000);
    return () => {
      alive = false; sender.current = () => {};
      off(); clearInterval(expiry); clearInterval(poll); clearTimeout(idleTimer); removeOwn();
    };
  }, [roomId, user?.id, user?.username, user?.full_name]);
  return { typingUsers: names, sendTyping: () => sender.current() };
}