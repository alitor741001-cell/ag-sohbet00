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
  const [notice, setNotice] = useState(null);
  const seenRef = useRef(new Set());

  const accept = useCallback((record) => {
    if (!record?.id || !record.room_id) return;
    // Kendi odamızdaki hediye zaten ekranda — gitmeye gerek yok.
    if (record.room_id === roomId && record.kind !== 'rocket') return;
    if (seenRef.current.has(record.id)) return;
    if (record.created_date && Date.now() - new Date(record.created_date).getTime() > VISIBLE_MS) return;
    seenRef.current.add(record.id);
    setNotice(record);
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

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return { notice, dismiss: () => setNotice(null) };
}