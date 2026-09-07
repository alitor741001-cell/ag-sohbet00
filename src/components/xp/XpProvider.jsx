import { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';

const XpContext = createContext(null);

export function useXpContext() {
  const ctx = useContext(XpContext);
  return ctx || { xp: 0, level: 1, frame: null };
}

export default function XpProvider({ children }) {
  const { user } = useCurrentUser();
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [frame, setFrame] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    base44.entities.User.get(user.id).then((u) => {
      setXp(u?.xp || 0);
      setLevel(u?.xp_level || 1);
      setFrame(u?.profile_frame || null);
    }).catch(() => {});
    const unsub = base44.entities.User.subscribe((ev) => {
      if (ev.type === 'update' && ev.data?.id === user.id) {
        setXp(ev.data.xp || 0);
        setLevel(ev.data.xp_level || 1);
        setFrame(ev.data.profile_frame || null);
      }
    });
    return unsub;
  }, [user?.id]);

  return <XpContext.Provider value={{ xp, level, frame }}>{children}</XpContext.Provider>;
}