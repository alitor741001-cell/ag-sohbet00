import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';

/** Odadaki canlı görüntülü PK: odadaki herkes (izleyiciler dahil) anında görür. */
export default function useRoomPkMatch(roomId) {
  const [match, setMatch] = useState(null);

  const load = useCallback(async () => {
    if (!roomId) { setMatch(null); return; }
    const page = await base44.entities.PkMatch.filter(
      { mode: 'video', status: 'live', $or: [{ room_id: roomId }, { guest_room_id: roomId }] },
      { sort: '-updated_date', limit: 1 },
    ).catch(() => null);
    setMatch(page?.items?.[0] || null);
  }, [roomId]);

  useEffect(() => {
    load();
    const off = subscribeEntity('PkMatch', (event) => {
      const data = event?.data || {};
      if (data.room_id === roomId || data.guest_room_id === roomId || event.id === match?.id) load();
    });
    return off;
  }, [roomId, load, match?.id]);

  return match;
}