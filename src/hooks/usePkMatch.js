import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import pkApi from '@/lib/pkApi';

/**
 * Odanın güncel PK kaydı: davet, canlı karşılaşma ve sonuç aynı kayıttan okunur.
 * Kayıt değiştiğinde (davet, kabul, başla, ses) herkes aynı durumu görür.
 */
export default function usePkMatch(roomId, enabled = true) {
  const [match, setMatch] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!roomId || !enabled) return;
    const page = await base44.entities.PkMatch.filter({ room_id: roomId }, { sort: '-created_date', limit: 1 });
    setMatch(page?.items?.[0] || null);
    setLoaded(true);
  }, [roomId, enabled]);

  useEffect(() => {
    if (!roomId || !enabled) return undefined;
    load();
    const unsubscribe = base44.entities.PkMatch.subscribe((event) => {
      const data = event?.data;
      if (data && data.room_id && data.room_id !== roomId) return;
      load();
    });
    // Yedek yoklama: realtime kaçarsa süre ve davet durumu kendini toparlar.
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') load();
    }, 6000);
    return () => { unsubscribe?.(); window.clearInterval(timer); };
  }, [roomId, enabled, load]);

  const run = useCallback(async (action, payload = {}) => {
    setBusy(true);
    try {
      const data = await pkApi(action, payload);
      if (data?.match) setMatch(data.match);
      else await load();
      return data;
    } finally {
      setBusy(false);
    }
  }, [load]);

  return { match, setMatch, loaded, load, run, busy };
}