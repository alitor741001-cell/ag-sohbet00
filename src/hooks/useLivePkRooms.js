import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Şu an canlı olan PK karşılaşmaları, oda kimliğine göre.
 * Oda listesinde sesli odalarla karışık görünür; yayın bitince kart normal hâline döner.
 */
export default function useLivePkRooms(enabled = true) {
  const [matches, setMatches] = useState({});

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;

    const load = async () => {
      const page = await base44.entities.PkMatch
        .filter({ status: 'live' }, { sort: '-created_date', limit: 50 })
        .catch(() => null);
      if (!alive || !page) return;
      const next = {};
      (page.items || []).forEach((match) => {
        if (match.room_id) next[match.room_id] = match;
      });
      setMatches(next);
    };

    load();
    // Yeni yayın açıldığında ve bittiğinde liste anında güncellenir.
    const unsubscribe = base44.entities.PkMatch.subscribe(() => load());
    // Canlı akışın kaçtığı cihazlarda kendini toparlar.
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') load();
    }, 8000);

    return () => { alive = false; unsubscribe?.(); window.clearInterval(timer); };
  }, [enabled]);

  return matches;
}