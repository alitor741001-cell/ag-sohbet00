import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const cache = {};

export function useXp(userId) {
  const [state, setState] = useState({ xp: 0, level: 1 });

  useEffect(() => {
    if (!userId) return;
    if (cache[userId]) { setState(cache[userId]); return; }
    base44.entities.UserXp.filter({ user_id: userId })
      .then((items) => {
        const data = items?.[0] || { xp: 0, level: 1 };
        const xp = data.xp || 0;
        const level = data.level || Math.floor(xp / 1000) + 1;
        const result = { xp, level };
        cache[userId] = result;
        setState(result);
      })
      .catch(() => {});
    const unsub = base44.entities.UserXp.subscribe((event) => {
      if (event.data?.user_id !== userId) return;
      const xp = event.data.xp || 0;
      const level = event.data.level || Math.floor(xp / 1000) + 1;
      cache[userId] = { xp, level };
      setState({ xp, level });
    });
    return unsub;
  }, [userId]);

  return state;
}

export default useXp;