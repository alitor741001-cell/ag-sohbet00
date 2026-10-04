import { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import GiftScene from '@/components/voice/GiftScene';
import useGiftAlerts from '@/hooks/useGiftAlerts';
import { useGiftCatalog } from '@/hooks/useGiftCatalog';

/**
 * Odada gönderilen hediyeleri herkesin görebileceği kısa animasyonla sahneye taşır.
 * Hediye mesajlarını dinler; sohbet paneli açık olmasa da animasyon görünür.
 */
export default function RoomGiftStage({ roomId }) {
  const { gifts, tiers } = useGiftCatalog();
  const [messages, setMessages] = useState([]);
  const giftMap = useMemo(() => new Map(gifts.map((item) => [item.id, item])), [gifts]);
  const resolveGift = useCallback((giftKey) => giftMap.get(giftKey) || null, [giftMap]);

  useEffect(() => {
    if (!roomId) return undefined;
    let active = true;
    setMessages([]);
    base44.entities.RoomMessage.filter({ room_id: roomId, type: 'gift' }, '-created_date', 20)
      .then((list) => { if (active) setMessages([...list].reverse()); })
      .catch(() => {});
    const unsubscribe = base44.entities.RoomMessage.subscribe((event) => {
      const data = event?.data;
      if (event.type !== 'create' || !data || data.room_id !== roomId || data.type !== 'gift') return;
      setMessages((prev) => (prev.some((item) => item.id === event.id) ? prev : [...prev, { ...data, id: event.id }].slice(-40)));
    });
    return () => { active = false; unsubscribe(); };
  }, [roomId]);

  const { alert } = useGiftAlerts(messages, resolveGift);
  return <GiftScene key={alert?.key} alert={alert} tiers={tiers} />;
}