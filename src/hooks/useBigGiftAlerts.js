import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';

// Duyuru ekranda bu kadar kalır (CSS big-gift-life süresiyle aynı).
const VISIBLE_MS = 10000;
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
    if (!record?.id || record.kind === 'rocket' || seenRef.current.has(record.id)) return;
    if (record.created_date && Date.now() - new Date(record.created_date).getTime() > FRESH_MS) return;
    seenRef.current.add(record.id);
    setQueue((prev) => prev.length ? [prev[0], ...[...prev.slice(1), record].slice(-(MAX_QUEUE - 1))] : [record]);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeEntity('BigGiftAlert', (event) => {
      if (event?.type === 'create' && event.data) accept({ ...event.data, id: event.id });
    });
    const poll = () => base44.entities.BigGiftAlert.filter({ kind: { $ne: 'rocket' } }, '-created_date', MAX_QUEUE)
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
  }, [queue[0]?.id]);

  return queue[0] || null;
}