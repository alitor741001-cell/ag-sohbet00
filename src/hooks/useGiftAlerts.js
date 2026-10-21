import { useCallback, useEffect, useRef, useState } from 'react';

const VISIBLE_MS = 5000;
// Aynı anda çok hediye gelse bile animasyonlar sırayla gösterilir; kuyruk kısa tutulur.
const MAX_QUEUE = 3;
// Gönderdiğim hediyenin canlı yayın kopyası bu süre boyunca yok sayılır: sahne iki kez oynamaz.
const ECHO_MS = 4000;

/** Odaya gelen hediyeleri sıraya alır: tekli/toplu gönderimler üst üste binmez. */
export default function useGiftAlerts(messages, resolveGift, selfId) {
  const [queue, setQueue] = useState([]);
  const seenRef = useRef(new Set());
  // Gönderim anında açılan sessizlik penceresi: kendi hediye mesajlarım yayından geri döner.
  const echoRef = useRef(0);

  // Aynı hediye seri gönderilirse yeni kart eklenmez; sayaç artar ve pop-up hızlıca akar.
  const merge = (prev, alert) => {
    const last = prev[prev.length - 1];
    const sameGift = !!last && !!last.giftId && last.giftId === alert.giftId
      && last.senderName === alert.senderName && last.recipientName === alert.recipientName;
    if (!sameGift) return prev.length ? [prev[0], ...[...prev.slice(1), alert].slice(-(MAX_QUEUE - 1))] : [alert];
    return [...prev.slice(0, -1), {
      ...last,
      key: alert.key,
      repeat: (last.repeat || 1) + 1,
      totalK: (Number(last.totalK) || 0) + (Number(alert.totalK) || 0),
    }];
  };

  // Gönderim başlarken ve yanıt geldiğinde pencere tazelenir; gecikmeli kopya da yok sayılır.
  const markOwnSend = useCallback(() => { echoRef.current = Date.now() + ECHO_MS; }, []);

  const push = useCallback((alert) => {
    echoRef.current = Date.now() + ECHO_MS;
    setQueue((prev) => merge(prev, alert));
  }, []);

  const markSeen = useCallback((ids) => {
    ids.forEach((id) => { if (id) seenRef.current.add(id); });
  }, []);

  const reset = useCallback(() => setQueue([]), []);

  useEffect(() => {
    const fresh = (Array.isArray(messages) ? messages : []).filter((message) => {
      if (message?.type !== 'gift' || !message.id || seenRef.current.has(message.id)) return false;
      if (!message.created_date || Date.now() - new Date(message.created_date).getTime() >= 15000) return false;
      // Kendi gönderdiğim hediye: yerel sahne zaten oynuyor, yayın kopyası ikinci kez başlamaz.
      if (selfId && message.user_id === selfId && echoRef.current > Date.now()) {
        seenRef.current.add(message.id);
        return false;
      }
      return true;
    });
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
  }, [messages, resolveGift, selfId]);

  useEffect(() => {
    if (!queue.length) return undefined;
    const timer = window.setTimeout(() => setQueue((prev) => prev.slice(1)), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [queue[0]?.key]);

  return { alert: queue[0] || null, push, markSeen, markOwnSend, reset };
}