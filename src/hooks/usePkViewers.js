import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * PK'nın izleyicileri: PK hangi sesli odada başladıysa o odanın dinleyicileridir.
 * Yayıncılar PK sayfasına geçerken odadan ayrıldığı için odada kalanlar izleyici sayılır.
 * Sayı ile birlikte kişilerin kendisi de döner: izleyici listesinde profil ve seviye gösterilir.
 */
export default function usePkViewers(roomId) {
  const [people, setPeople] = useState([]);

  useEffect(() => {
    if (!roomId) { setPeople([]); return undefined; }
    let cancelled = false;
    const load = async () => {
      const response = await base44.functions.invoke('room-presence', { action: 'get', room_id: roomId }).catch(() => null);
      const participants = (response?.data?.room?.participants || []).filter((person) => person?.user_id);
      if (!cancelled) setPeople(participants);
    };
    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') load();
    }, 10000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [roomId]);

  return people;
}