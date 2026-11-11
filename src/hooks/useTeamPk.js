import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';

/** Odadaki açık normal (takım) PK: odadaki herkes barı canlı görür. */
export default function useTeamPk(roomId) {
  const [match, setMatch] = useState(null);
  const load = useCallback(async () => {
    if (!roomId) { setMatch(null); return; }
    const rows = await base44.entities.TeamPkMatch.filter({ room_id: roomId, active: true }, '-updated_date', 1).catch(() => []);
    setMatch(Array.isArray(rows) && rows.length ? rows[0] : null);
  }, [roomId]);

  useEffect(() => {
    load();
    return subscribeEntity('TeamPkMatch', (event) => {
      if (event?.data?.room_id === roomId || event?.id === match?.id) load();
    });
  }, [roomId, load, match?.id]);

  return { match, reload: load, setMatch };
}