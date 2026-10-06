import { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Odaların canlılığını çevrim içi oda işaretçisinden izler. İşaretçisi bu odayı gösteren
 * biri varsa oda açık sayılır — odayı açan kişi için ana sayfada hemen belirir. Çıkışta
 * işaretçi silindiği için oda anında listeden düşer; gizleme ve yeniden gösterme de
 * içeridekilerin işaretçisi yazılıp silindiğinden anında yansır.
 */
export default function useRoomPresence(rooms) {
  const [records, setRecords] = useState({});

  const ids = useMemo(() => {
    const unique = new Set();
    (rooms || []).forEach((room) => { if (room?.id) unique.add(room.id); });
    return [...unique].sort();
  }, [rooms]);
  const idsKey = ids.join(',');

  useEffect(() => {
    if (!idsKey) { setRecords({}); return; }
    const roomIds = idsKey.split(',');
    // Yalnızca bu odaları işaret eden kayıtlar tutulur.
    const keep = (record) => Boolean(record?.user_id && record.current_room_id && roomIds.includes(record.current_room_id));
    let alive = true;
    // N+1 önleme: odalara bağlı tüm çevrim içi kayıtlar tek sorguda çekilir.
    base44.entities.UserPresence.filter({ current_room_id: { $in: roomIds } }, '-updated_date', 200)
      .then((found) => {
        if (!alive) return;
        const map = {};
        (found || []).forEach((record) => { if (keep(record)) map[record.user_id] = record; });
        setRecords(map);
      })
      .catch(() => {});

    // Anlık yansıma: biri odaya girdiği ya da çıktığı anda kayıt canlı güncellenir.
    const unsubscribe = base44.entities.UserPresence.subscribe((event) => {
      const record = event.data;
      if (!record?.user_id) return;
      setRecords((prev) => {
        const next = { ...prev };
        // Olay yalnızca değişen alanları taşıyabilir: kayıt eskisiyle birleştirilir.
        const merged = { ...(prev[record.user_id] || {}), ...record };
        // Kayıt artık bir odayı işaret etmiyorsa (ya da silindiyse) listeden düşer.
        if (event.type === 'delete' || !merged.current_room_id || !keep(merged)) delete next[record.user_id];
        else next[record.user_id] = merged;
        return next;
      });
    });
    return () => { alive = false; unsubscribe(); };
  }, [idsKey]);

  /** Çevrim içi kaydı bu odayı gösteren odalar canlı sayılır. */
  const liveRoomIds = useMemo(() => {
    const live = new Set();
    Object.values(records).forEach((record) => {
      if (record.current_room_id) live.add(record.current_room_id);
    });
    return live;
  }, [records]);

  const isLive = useCallback((room) => Boolean(room?.id && liveRoomIds.has(room.id)), [liveRoomIds]);

  return { isLive, liveRoomIds };
}