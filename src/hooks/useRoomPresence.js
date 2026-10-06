import { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Odadaki kişi bu süre içinde görülmediyse odada sayılmaz: böylece oda, içinde
// kimse kalmadıktan en geç bir dakika sonra ana sayfadaki açık odalar listesinden düşer.
const ONLINE_WINDOW_MS = 60000;

/**
 * Odaların canlılığını çevrim içi kayıtlarından izler. Bir oda, içinde çevrim içi en az
 * bir kişi (sahibi dahil) varken açık sayılır: odaya girenin kaydı anında yayınlandığı
 * için oda herkeste aynı saniyede belirir, son kişi çıktıktan sonra en geç bir dakika
 * içinde listeden düşer. Gizlenen odada içeridekilerin canlı işaretçisi silindiğinden
 * gizleme ve yeniden gösterme de anında yansır.
 */
export default function useRoomPresence(rooms) {
  const [records, setRecords] = useState({});
  const [now, setNow] = useState(() => Date.now());

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
      setNow(Date.now());
    });
    return () => { alive = false; unsubscribe(); };
  }, [idsKey]);

  // Tazelik yoklanır: kimse kalmayan oda en geç bir dakika sonra listeden düşer.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);

  /** Çevrim içi kaydı bu odayı işaret eden herkesin odası canlı sayılır. */
  const liveRoomIds = useMemo(() => {
    const live = new Set();
    Object.values(records).forEach((record) => {
      const fresh = record.last_seen && now - new Date(record.last_seen).getTime() < ONLINE_WINDOW_MS;
      if (record.current_room_id && fresh) live.add(record.current_room_id);
    });
    return live;
  }, [records, now]);

  const isLive = useCallback((room) => Boolean(room?.id && liveRoomIds.has(room.id)), [liveRoomIds]);

  return { isLive, liveRoomIds };
}