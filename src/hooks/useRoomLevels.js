import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Odadaki kişilerin oda LVL'i.
 * Seviye yükseldiğinde odayı ya da sayfayı yenilemeye gerek kalmaz: rozet canlı güncellenir.
 */
export default function useRoomLevels(userIds = []) {
  const idsKey = useMemo(() => [...new Set((userIds || []).filter(Boolean))].sort().join('|'), [userIds]);
  const [levels, setLevels] = useState({});

  useEffect(() => {
    const ids = idsKey ? idsKey.split('|') : [];
    if (!ids.length) {
      setLevels({});
      return;
    }
    let alive = true;
    // Kişi başına yalnızca kendi kaydı geçerlidir; eski oda kayıtları seviye sayılmaz.
    base44.entities.RoomLevel.filter({ user_id: { $in: ids }, owner_id: { $in: ids } }, '-created_date', Math.min(200, ids.length * 4))
      .then((rows) => {
        if (!alive) return;
        const map = {};
        (rows || []).forEach((row) => {
          if (!row?.user_id || row.owner_id !== row.user_id || map[row.user_id] !== undefined) return;
          map[row.user_id] = Math.max(0, Math.floor(Number(row.level) || 0));
        });
        setLevels(map);
      })
      .catch(() => {});

    // Seviye atlama anında ekrana düşer — oda yenilenmez.
    const unsubscribe = base44.entities.RoomLevel.subscribe((event) => {
      const row = event?.data;
      if (!row?.user_id || !ids.includes(row.user_id)) return;
      if (event.type === 'delete') {
        setLevels((current) => {
          const next = { ...current };
          delete next[row.user_id];
          return next;
        });
        return;
      }
      setLevels((current) => ({ ...current, [row.user_id]: Math.max(0, Math.floor(Number(row.level) || 0)) }));
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, [idsKey]);

  return levels;
}