import { useCallback, useEffect, useRef, useState } from 'react';

const VISIBLE_MS = 2200;
// Aynı anda çok hediye gelse bile animasyonlar sırayla gösterilir; kuyruk kısa tutulur.
const MAX_QUEUE = 4;

/** Odaya gelen hediyeleri sıraya alır: tekli/toplu gönderimler üst üste binmez. */
export default function useGiftAlerts(messages, resolveGift) {
  const [queue, setQueue] = useState([]);
  const seenRef = useRef(new Set());

  const push = useCallback((alert) => {
    setQueue((prev) => [...prev, alert].slice(-MAX_QUEUE));
  }, []);

  const markSeen = useCallback((ids) => {
    ids.forEach((id) => { if (id) seenRef.current.add(id); });
  }, []);

  const reset = useCallback(() => setQueue([]), []);

  useEffect(() => {
    const fresh = (Array.isArray(messages) ? messages : []).filter((message) => (
      message?.type === 'gift'
      && message.id
      && !seenRef.current.has(message.id)
      && message.created_date
      && Date.now() - new Date(message.created_date).getTime() < 15000
    ));
    if (!fresh.length) return;

    const alerts = fresh.slice(-MAX_QUEUE).map((message) => {
      seenRef.current.add(message.id);
      const gift = resolveGift(message.gift) || {};
      return {
        key: message.id,
        giftId: message.gift,
        giftName: gift.name || 'Hediye',
        emoji: message.gift_emoji || gift.emoji || '🎁',
        imageUrl: gift.image_url || '',
        kValue: Number(message.gift_k) || Number(gift.k_value) || 0,
        senderName: message.user_name || '',
        recipientName: message.gift_to_name || '',
        toId: message.gift_to_id || '',
        count: 1,
      };
    });
    setQueue((prev) => [...prev, ...alerts].slice(-MAX_QUEUE));
  }, [messages, resolveGift]);

  useEffect(() => {
    if (!queue.length) return undefined;
    const timer = window.setTimeout(() => setQueue((prev) => prev.slice(1)), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [queue]);

  return { alert: queue[0] || null, push, markSeen, reset };
}