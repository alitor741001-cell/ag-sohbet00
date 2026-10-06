import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Çevrim içi penceresi: nabız 20 sn'de bir yazılır, kayıt 60 sn tazelenmezse kişi çevrim dışı sayılır.
const ONLINE_WINDOW_MS = 60000;
// Pencere gerçek saate göre işlesin diye durum düzenli aralıkla yeniden değerlendirilir.
const TICK_MS = 15000;

/**
 * Aynı kullanıcı için birden fazla kayıt bulunabilir (ör. eski oturumlardan kalanlar).
 * Geçerli olan tek kayıt en taze olandır: listeler her zaman bu kayıt üzerinden okunur.
 */
function freshest(a, b) {
  if (!a) return b;
  if (!b) return a;
  return new Date(b.last_seen || 0) >= new Date(a.last_seen || 0) ? b : a;
}

export default function useFriendPresence(user, maintain = false) {
  const [presence, setPresence] = useState([]);
  const [now, setNow] = useState(Date.now());
  const ownRef = useRef(null);

  const load = useCallback(async () => {
    if (!user) return;
    const records = await base44.entities.UserPresence.list('-updated_date', 200);
    const others = records.filter((record) => record.user_id && record.user_id !== user.id);
    // Kendi kaydı listenin dışından okunur: eski bir kaydı bulup yenisini açmaz,
    // böylece kişi başına tek kayıt kalır.
    const mine = await base44.entities.UserPresence.filter({ user_id: user.id }, '-updated_date', 10).catch(() => []);
    let own = mine.reduce(freshest, null);
    if (maintain) {
      const data = { online: document.visibilityState === 'visible' && navigator.onLine, last_seen: new Date().toISOString() };
      own = own
        ? await base44.entities.UserPresence.update(own.id, data)
        : await base44.entities.UserPresence.create({ user_id: user.id, ...data });
      // Kendi eski kayıtları temizlenir: aynı kişi için tek kayıt kalır.
      await Promise.all(mine
        .filter((record) => record.id !== own.id)
        .map((record) => base44.entities.UserPresence.delete(record.id).catch(() => {})));
    }
    setPresence(own ? [own, ...others] : others);
    ownRef.current = own;
  }, [user?.id, maintain]);

  // Kaydı tazelenmeyen kişi kendiliğinden çevrim dışı görünür.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!user) return;
    load();
    const off = base44.entities.UserPresence.subscribe((event) => {
      const id = event.data?.id || event.id;
      setPresence((current) => {
        if (event.type === 'delete') {
          const gone = current.find((item) => item.id === id);
          if (gone?.user_id === user.id) ownRef.current = null;
          return current.filter((item) => item.id !== id);
        }
        const merged = { ...(event.data || {}), id };
        if (!merged.user_id) return current;
        // Aynı kişinin başka bir kaydı varsa yalnızca en tazesi tutulur.
        const known = current.find((item) => item.id === id || item.user_id === merged.user_id);
        const winner = freshest(known, merged);
        if (winner.user_id === user.id) ownRef.current = winner;
        return [winner, ...current.filter((item) => item.id !== id && item.user_id !== merged.user_id)];
      });
      setNow(Date.now());
    });
    if (!maintain) return off;

    const update = async (online) => {
      const data = { online, last_seen: new Date().toISOString() };
      if (!ownRef.current) {
        ownRef.current = await base44.entities.UserPresence.create({ user_id: user.id, ...data });
      } else {
        ownRef.current = { ...ownRef.current, ...data };
        await base44.entities.UserPresence.update(ownRef.current.id, data);
      }
      setNow(Date.now());
    };
    const syncVisibility = () => update(document.visibilityState === 'visible' && navigator.onLine).catch(() => {});
    const goOffline = () => update(false).catch(() => {});
    // Nabız 20sn'de bir: sekme arkadayken boşuna yazılmaz, görünürlük olayı zaten yazar.
    const heartbeat = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      syncVisibility();
    }, 20000);
    document.addEventListener('visibilitychange', syncVisibility);
    window.addEventListener('online', syncVisibility);
    window.addEventListener('offline', syncVisibility);
    window.addEventListener('pagehide', goOffline);
    window.addEventListener('beforeunload', goOffline);
    return () => {
      clearInterval(heartbeat);
      off();
      document.removeEventListener('visibilitychange', syncVisibility);
      window.removeEventListener('online', syncVisibility);
      window.removeEventListener('offline', syncVisibility);
      window.removeEventListener('pagehide', goOffline);
      window.removeEventListener('beforeunload', goOffline);
      goOffline();
    };
  }, [user?.id, load, maintain]);

  // Satır başına doğrusal arama yapılmaz: kişi başına tek kayıt kimliğe göre tek dizinde tutulur,
  // listeler yeniden çizilirken arama maliyeti sabit kalır.
  const byUser = useMemo(() => {
    const map = new Map();
    presence.forEach((record) => {
      if (!record?.user_id) return;
      const current = map.get(record.user_id);
      map.set(record.user_id, freshest(current, record));
    });
    return map;
  }, [presence]);
  const isOnline = (userId) => {
    const record = byUser.get(userId);
    return Boolean(record?.online && now - new Date(record.last_seen).getTime() < ONLINE_WINDOW_MS);
  };
  const getRoomId = (userId) => byUser.get(userId)?.current_room_id || '';
  const getLastSeen = (userId) => byUser.get(userId)?.last_seen || null;
  return { isOnline, getRoomId, getLastSeen };
}