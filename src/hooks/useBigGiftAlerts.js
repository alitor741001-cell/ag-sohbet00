import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';

// Duyuru ekranda bu kadar kalır (CSS big-gift-life süresiyle aynı).
const VISIBLE_MS = 7000;
// Gerçek zamanlı yayın gecikirse yoklama aynı duyuruyu yakalar.
// Yedek yoklama seyrek çalışır (sekme arkadayken hiç çalışmaz) — istek yükünü düşürür.
const POLL_MS = 30000;
// Yalnızca taze duyurular gösterilir; odaya sonradan girenler eskileri görmez.
const FRESH_MS = 20000;
const MAX_QUEUE = 3;

/**
 * Büyük hediye duyuruları bütün sesli odalara aynı anda düşer.
 * Gerçek zamanlı yayın ve kısa aralıklı yoklama birlikte çalışır; aynı duyuru
 * bir kez gösterilir, birden fazlası gelirse sırayla oynar.
 */
export default function useBigGiftAlerts() {
  const [queue, setQueue] = useState([]);
  const seenRef = useRef(new Set());

  const accept = useCallback((record) => {
    if (!record?.id || seenRef.current.has(record.id)) return;
    if (record.created_date && Date.now() - new Date(record.created_date).getTime() > FRESH_MS) return;
    seenRef.current.add(record.id);
    setQueue((prev) => [...prev, record].slice(-MAX_QUEUE));
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeEntity('BigGiftAlert', (event) => {
      if (event?.type === 'create' && event.data) accept({ ...event.data, id: event.id });
    });
    const poll = () => base44.entities.BigGiftAlert.list('-created_date', MAX_QUEUE)
      .then((rows) => rows.forEach(accept))
      .catch(() => {});
    const tick = () => { if (document.visibilityState !== 'hidden') poll(); };
    poll();
    const timer = window.setInterval(tick, POLL_MS);
    return () => { unsubscribe(); window.clearInterval(timer); };
  }, [accept]);

  useEffect(() => {
    if (!queue.length) return undefined;
    const timer = window.setTimeout(() => setQueue((prev) => prev.slice(1)), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [queue]);

  return queue[0] || null;
}