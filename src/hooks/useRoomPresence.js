import { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Odadaki kişi bu süre içinde görülmediyse odada sayılmaz: böylece oda, içinde
// kimse kalmadıktan en geç bir dakika sonra ana sayfadaki açık odalar listesinden düşer.
const ONLINE_WINDOW_MS = 60000;

/**
 * Odalarda bulunan kişilerin çevrim içi durumunu izler. Bir oda yalnızca sahibi
 * dışında en az bir kişi çevrim içiyse "açık" sayılır: sahibi tek başınayken
 * oda ana sayfada açık görünmez.
 */
export default function useRoomPresence(rooms) {
  const [records, setRecords] = useState({});
  const [now, setNow] = useState(() => Date.now());

  const ids = useMemo(() => {
    const unique = new Set();
    (rooms || []).forEach((room) => (room.participants || []).forEach((person) => {
      if (person.user_id) unique.add(person.user_id);
    }));
    return [...unique].sort();
  }, [rooms]);
  const idsKey = ids.join(',');

  useEffect(() => {
    if (!idsKey) { setRecords({}); return; }
    const list = idsKey.split(',');
    let alive = true;
    // N+1 önleme: tüm katılımcıların çevrim içi kayıtları tek sorguda çekilir.
    base44.entities.UserPresence.filter({ user_id: { $in: list } }, '-updated_date', list.length)
      .then((found) => {
        if (!alive) return;
        const map = {};
        (found || []).forEach((record) => { if (record?.user_id) map[record.user_id] = record; });
        setRecords(map);
      })
      .catch(() => {});

    // Nabız: odadaki kişi uygulamayı kapattığı anda kayıt canlı olarak güncellenir.
    const unsubscribe = base44.entities.UserPresence.subscribe((event) => {
      const record = event.data;
      if (!record?.user_id || !list.includes(record.user_id)) return;
      // Olay yalnızca değişen alanları taşıyabilir: kayıt eskisiyle birleştirilir.
      setRecords((prev) => ({ ...prev, [record.user_id]: { ...(prev[record.user_id] || {}), ...record } }));
      setNow(Date.now());
    });
    return () => { alive = false; unsubscribe(); };
  }, [idsKey]);

  // Tazelik yoklanır: kimse kalmayan oda en geç bir dakika sonra listeden düşer.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 20000);
    return () => window.clearInterval(timer);
  }, []);

  const isOnline = useCallback((userId) => {
    const record = records[userId];
    return Boolean(record?.online && record.last_seen && now - new Date(record.last_seen).getTime() < ONLINE_WINDOW_MS);
  }, [records, now]);

  /** Odada sahibi dışında çevrim içi en az bir kişi var mı? */
  const hasLiveOthers = useCallback((room) => {
    const owner = room?.owner_id;
    return (room?.participants || []).some((person) => person.user_id && person.user_id !== owner && isOnline(person.user_id));
  }, [isOnline]);

  return { hasLiveOthers, isOnline };
}