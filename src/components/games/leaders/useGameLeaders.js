import { useCallback, useEffect, useState } from 'react';
import gameRequest from '@/lib/gameRequest';

const REFRESH_MS = 30000;
const EMPTY = { today: [], week: [], total: [] };

/** Oyun kazananları: bugün, bu hafta ve toplam ilk 50 kişi. */
export default function useGameLeaders(game) {
  const [leaders, setLeaders] = useState(EMPTY);

  const load = useCallback(async () => {
    if (!game) return;
    const response = await gameRequest('game-leaders', { game }).catch(() => null);
    if (response?.data) setLeaders({ ...EMPTY, ...response.data });
  }, [game]);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') load();
    }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  // Rozette görünen kişi: toplamda en çok kazanan, yoksa haftanın ya da günün birincisi.
  const top = leaders.total[0] || leaders.week[0] || leaders.today[0] || null;
  return { leaders, top, reload: load };
}