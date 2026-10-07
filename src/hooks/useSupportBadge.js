import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';

/** Destek sayfası görüldüğünde kullanılan anahtar: okunma zamanı kullanıcı bazında saklanır. */
const seenKeyFor = (userId) => `destek-okundu:${userId}`;

/**
 * Alt menüdeki canlı destek düğmesi için okunmamış yönetici yanıtı sayısı.
 * Support sayfası açıldığında yayılan 'destek-goruldu' olayıyla anında sıfırlanır.
 */
export default function useSupportBadge(userId) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) { setCount(0); return undefined; }
    let alive = true;
    const key = seenKeyFor(userId);
    const countUnread = (items) => {
      const lastSeen = new Date(localStorage.getItem(key) || 0).getTime();
      return items.filter((message) => new Date(message.created_date || 0).getTime() > lastSeen).length;
    };
    const load = async () => {
      try {
        const items = await base44.entities.SupportMessage.filter({ owner_id: userId, sender: 'admin' }, '-created_date', 50);
        if (alive) setCount(countUnread(items || []));
      } catch {
        // Okuma başarısızsa mevcut rozet korunur.
      }
    };
    load();
    // Yönetici yanıtı geldiği an rozet artar.
    const off = subscribeEntity('SupportMessage', (event) => {
      if (event.type !== 'create') return;
      const row = event.data;
      if (!row || row.owner_id !== userId || row.sender !== 'admin') return;
      setCount((current) => current + 1);
    });
    const onSeen = () => setCount(0);
    const onRefresh = () => load();
    window.addEventListener('destek-goruldu', onSeen);
    window.addEventListener('destek-rozet-tazele', onRefresh);
    return () => {
      alive = false;
      off();
      window.removeEventListener('destek-goruldu', onSeen);
      window.removeEventListener('destek-rozet-tazele', onRefresh);
    };
  }, [userId]);

  return count;
}