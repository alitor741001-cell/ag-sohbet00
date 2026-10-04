import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Duyuru ekranda bu kadar kalır (CSS big-gift-life süresiyle aynı).
const VISIBLE_MS = 7000;

/**
 * Büyük hediye duyuruları tüm sesli odalara aynı anda düşer.
 * Aynı anda birden fazlası gelirse sırayla gösterilir.
 */
export default function useBigGiftAlerts() {
  const [queue, setQueue] = useState([]);
  const seenRef = useRef(new Set());

  useEffect(() => {
    const unsubscribe = base44.entities.BigGiftAlert.subscribe((event) => {
      const data = event?.data;
      if (event?.type !== 'create' || !data || !event.id || seenRef.current.has(event.id)) return;
      seenRef.current.add(event.id);
      setQueue((prev) => [...prev, { ...data, id: event.id }].slice(-3));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!queue.length) return undefined;
    const timer = window.setTimeout(() => setQueue((prev) => prev.slice(1)), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [queue]);

  return queue[0] || null;
}