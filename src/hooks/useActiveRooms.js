import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';

/**
 * Yayındaki odalar: özel sohbette "Yayında" şeridi ve odaya katılma bağlantısı
 * bu listeden okunur. Ana sayfa sohbeti ve oda içi sohbet aynı veriyi kullanır.
 */
export default function useActiveRooms(tabActive = true) {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    if (!tabActive) return;
    let active = true;
    let timer = null;
    const load = async () => {
      const items = await base44.entities.Room.filter({ status: 'active' }, '-updated_date', 200).catch(() => []);
      if (active) setRooms(items);
    };
    load();
    const unsub = subscribeEntity('Room', (event) => {
      // Oda kaydı olayın içinde geldiği için yayın göstergesi beklemeden güncellenir.
      const incoming = event.data;
      const id = incoming?.id || event.id;
      if (!id) return;
      setRooms((current) => {
        const rest = current.filter((room) => room.id !== id);
        return incoming && event.type !== 'delete' && incoming.status !== 'closed' ? [incoming, ...rest] : rest;
      });
      clearTimeout(timer);
      timer = setTimeout(load, 2500);
    });
    // Abonelik düşen cihazlarda (mobil/PWA) gösterge doğru kalsın diye düzenli tazeleme.
    const interval = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      load();
    }, 5000);
    return () => { active = false; clearTimeout(timer); clearInterval(interval); unsub(); };
  }, [tabActive]);

  // Kişinin yayında olduğu oda en son hareket gören odadır; gizli odalar gösterilmez.
  const getRoomId = (personId) => {
    if (!personId) return '';
    let best = null;
    rooms.forEach((room) => {
      if (room.status !== 'active' || room.hidden) return;
      const inside = [...(room.participants || []), ...(room.seats || [])].some((person) => person?.user_id === personId);
      if (!inside) return;
      if (!best || new Date(room.updated_date || 0) > new Date(best.updated_date || 0)) best = room;
    });
    return best?.id || '';
  };

  return { rooms, getRoomId };
}