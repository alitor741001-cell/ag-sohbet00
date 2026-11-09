import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * PK'nın izleyici sayısı: PK hangi sesli odada başladıysa o odanın dinleyicileri izleyicidir.
 * Yayıncılar PK sayfasına geçerken odadan ayrıldığı için odada kalanlar izleyici sayılır.
 */
export default function usePkViewers(roomId) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!roomId) { setCount(0); return undefined; }
    let cancelled = false;
    const load = async () => {
      const response = await base44.functions.invoke('room-presence', { action: 'get', room_id: roomId }).catch(() => null);
      const participants = response?.data?.room?.participants || [];
      if (!cancelled) setCount(participants.length);
    };
    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') load();
    }, 10000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [roomId]);

  return count;
}