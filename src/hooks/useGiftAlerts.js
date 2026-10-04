import { useCallback, useEffect, useRef, useState } from 'react';

const VISIBLE_MS = 2600;
// Aynı anda çok hediye gelse bile animasyonlar sırayla gösterilir; kuyruk kısa tutulur.
const MAX_QUEUE = 3;

/** Odaya gelen hediyeleri sıraya alır: tekli/toplu gönderimler üst üste binmez. */
export default function useGiftAlerts(messages, resolveGift) {
  const [queue, setQueue] = useState([]);
  const seenRef = useRef(new Set());

  // Aynı hediye seri gönderilirse yeni kart eklenmez; sayaç artar ve pop-up hızlıca akar.
  const merge = (prev, alert) => {
    const last = prev[prev.length - 1];
    const sameGift = !!last && !!last.giftId && last.giftId === alert.giftId
      && last.senderName === alert.senderName && last.recipientName === alert.recipientName;
    if (!sameGift) return [...prev, alert].slice(-MAX_QUEUE);
    return [...prev.slice(0, -1), {
      ...last,
      key: alert.key,
      repeat: (last.repeat || 1) + 1,
      totalK: (Number(last.totalK) || 0) + (Number(alert.totalK) || 0),
    }];
  };

  const push = useCallback((alert) => {
    setQueue((prev) => merge(prev, alert));
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
    setQueue((prev) => alerts.reduce(merge, prev));
  }, [messages, resolveGift]);

  useEffect(() => {
    if (!queue.length) return undefined;
    const timer = window.setTimeout(() => setQueue((prev) => prev.slice(1)), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [queue]);

  return { alert: queue[0] || null, push, markSeen, reset };
}