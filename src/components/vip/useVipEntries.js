import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { useCurrentUser } from '@/lib/useCurrentUser';
export default function useVipEntries(roomId) {
  const { user } = useCurrentUser();
  const [queue, setQueue] = useState([]); const [preferences, setPreferences] = useState(null); const mountedAt = useRef(Date.now());
  useEffect(() => {
    if (!roomId || !user?.id) return;
    let alive = true; mountedAt.current = Date.now(); setQueue([]); setPreferences(null);
    const storageKey = `ag-entry-seen:${user.id}:${roomId}`;
    const seen = new Set(JSON.parse(sessionStorage.getItem(storageKey) || '[]'));
    const receive = event => {
      if (!alive || event.room_id !== roomId || !event.audience_ids?.includes(user.id) || seen.has(event.id) || Date.now() - Date.parse(event.created_date) > 20000) return;
      if (Date.parse(event.created_date) < mountedAt.current && event.user_id !== user.id) return;
      seen.add(event.id); sessionStorage.setItem(storageKey, JSON.stringify([...seen].slice(-100)));
      setQueue(old => [...old, event].slice(-4));
    };
    const off = subscribeEntity('RoomEntranceEvent', event => { if (event.type === 'create') receive({ ...event.data, id: event.id || event.data?.id }); });
    const offPrefs = subscribeEntity('CosmeticSelection', event => { if (event.data?.owner_id === user.id) setPreferences(event.data); });
    base44.entities.CosmeticSelection.filter({ owner_id: user.id }, { limit: 1 }).then(page => { if (alive) setPreferences(old => old || page.items[0] || {}); });
    base44.entities.RoomEntranceEvent.filter({ room_id: roomId, created_date: { $gte: new Date(mountedAt.current - 15000).toISOString() } }, { sort: 'created_date', limit: 15 }).then(page => page.items.forEach(receive));
    return () => { alive = false; off(); offPrefs(); };
  }, [roomId, user?.id]);
  const first = queue[0];
  useEffect(() => {
    if (!first || !preferences) return;
    const timer = setTimeout(() => setQueue(old => old[0]?.id === first.id ? old.slice(1) : old), preferences.show_entrances === false ? 0 : 6500);
    return () => clearTimeout(timer);
  }, [first?.id, preferences]);
  return { person: preferences && preferences.show_entrances !== false ? first : null, reduced: preferences?.reduce_motion, dismiss: () => setQueue(old => old.slice(1)) };
}