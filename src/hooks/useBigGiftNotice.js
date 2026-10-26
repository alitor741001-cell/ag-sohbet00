import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';

// Sohbet satırı bu kadar süre görünür kalır — geç fark edilse de tıklanabilir.
const VISIBLE_MS = 120000;
// Gerçek zamanlı yayın gecikirse yoklama aynı duyuruyu yakalar.
// Yedek yoklama seyrek çalışır (sekme arkadayken hiç çalışmaz) — istek yükünü düşürür.
const POLL_MS = 30000;

/**
 * Sohbet bölümünün altındaki büyük hediye satırı.
 * Yalnızca başka bir odada atılan taze duyurular gösterilir; satıra basılınca
 * hediye atan kişinin odasına gidilir.
 */
export default function useBigGiftNotice(roomId) {
  const [notices, setNotices] = useState([]);
  const seenRef = useRef(new Set());

  const accept = useCallback((record) => {
    if (!record?.id || !record.room_id) return;
    // Kendi odamızdaki hediye zaten ekranda — gitmeye gerek yok.
    if (record.room_id === roomId && record.kind !== 'rocket') return;
    if (seenRef.current.has(record.id)) return;
    if (record.created_date && Date.now() - new Date(record.created_date).getTime() > VISIBLE_MS) return;
    seenRef.current.add(record.id);
    const item = { ...record, shown_at: Date.now() };
    // Roket patlamaları alt alta birikir (LVL 1, LVL 2 …); normal hediye satırı tek kalır.
    setNotices((previous) => record.kind === 'rocket'
      ? [...previous.filter(entry => entry.id !== record.id), item].slice(-4)
      : [item]);
  }, [roomId]);

  useEffect(() => {
    const unsubscribe = subscribeEntity('BigGiftAlert', (event) => {
      if (event?.type === 'create' && event.data) accept({ ...event.data, id: event.id });
    });
    const poll = () => base44.entities.BigGiftAlert.list('-created_date', 3)
      .then((rows) => rows.forEach(accept))
      .catch(() => {});
    const tick = () => { if (document.visibilityState !== 'hidden') poll(); };
    poll();
    const timer = window.setInterval(tick, POLL_MS);
    return () => { unsubscribe(); window.clearInterval(timer); };
  }, [accept]);

  // Süresi dolan satırlar tek tek düşer; yenisi gelince eskisi yerinde kalır.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNotices((previous) => {
        const alive = previous.filter(entry => Date.now() - entry.shown_at < VISIBLE_MS);
        return alive.length === previous.length ? previous : alive;
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const dismiss = useCallback((noticeId) => {
    setNotices((previous) => (noticeId ? previous.filter(entry => entry.id !== noticeId) : []));
  }, []);

  return { notices, notice: notices[notices.length - 1] || null, dismiss };
}