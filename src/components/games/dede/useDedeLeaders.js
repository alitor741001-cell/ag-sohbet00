import { useCallback, useEffect, useState } from 'react';
import gameRequest from '@/lib/gameRequest';

const REFRESH_MS = 30000;

/** Dede kazananları: bugün, bu hafta ve toplam en çok kazanan. */
export default function useDedeLeaders() {
  const [leaders, setLeaders] = useState({ today: null, week: null, total: null });

  const load = useCallback(async () => {
    const response = await gameRequest('dede-game', { action: 'leaders' }).catch(() => null);
    if (response?.data) setLeaders(response.data);
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') load();
    }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  return { leaders, reload: load };
}