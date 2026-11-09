import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import pkApi from '@/lib/pkApi';

/** PK sohbetinin kayıt kimliği: tur sohbeti maç kimliğiyle saklanır, oda sohbetine karışmaz. */
export const pkChatRoomId = (matchId) => `pk-${matchId}`;

/**
 * Görüntülü PK sohbeti: iki tarafın mesajları maç kaydıyla birlikte tutulur.
 * Akış yalnızca maç değiştiğinde tazelenir; panel kapanıp açıldığında mesajlar silinmez,
 * böylece yazışmalar her zaman görülebilir.
 */
export default function usePkChat(matchId) {
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!matchId) return undefined;
    const roomId = pkChatRoomId(matchId);
    let cancelled = false;

    const load = async () => {
      const page = await base44.entities.RoomMessage
        .filter({ room_id: roomId }, { sort: '-created_date', limit: 80 })
        .catch(() => null);
      // Akış eskiden yeniye gösterilir; sunucudan en yeniler önce gelir.
      if (!cancelled) setMessages((page?.items || []).slice().reverse());
    };
    load();

    const off = subscribeEntity('RoomMessage', (event) => {
      if (event.data?.room_id !== roomId) return;
      if (event.type === 'create' && event.data) {
        setMessages((prev) => (prev.some((row) => row.id === event.data.id) ? prev : [...prev, event.data]));
      } else if (event.type === 'delete') {
        setMessages((prev) => prev.filter((row) => row.id !== event.id));
      }
    });

    return () => { cancelled = true; off?.(); };
  }, [matchId]);

  const send = useCallback(async (value) => {
    const text = String(value || '').trim();
    if (!text || !matchId) return;
    setSending(true);
    try {
      await pkApi('chat-send', { id: matchId, text });
    } finally {
      setSending(false);
    }
  }, [matchId]);

  return { messages, send, sending };
}