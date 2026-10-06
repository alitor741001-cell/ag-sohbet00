import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { applyUserXp, userXpKey, xpConfigKey } from '@/components/xp/xpCache';
import { clearFrameCaches } from '@/components/xp/frameTransparency';

// XP, çerçeve ve ayar değişikliklerini tüm uygulamaya gerçek zamanlı yayar.
export default function XpProvider({ children }) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const offXp = subscribeEntity('UserXp', (event) => {
      if (event.type === 'delete') queryClient.invalidateQueries({ queryKey: userXpKey });
      else applyUserXp(queryClient, event.data);
    });
    const applyXpFrame = (event) => {
      clearFrameCaches();
      queryClient.setQueriesData({ queryKey: xpConfigKey }, (current) => {
      if (!current) return current;
      let frames;
      if (event.type === 'delete') frames = current.frames.filter((f) => f.id !== event.data.id);
      else {
        const exists = current.frames.some((f) => f.id === event.data.id);
        frames = exists ? current.frames.map((f) => (f.id === event.data.id ? { ...f, ...event.data } : f)) : [...current.frames, event.data];
        frames = [...frames].sort((a, b) => (a.min_xp || 0) - (b.min_xp || 0));
      }
      return { ...current, frames };
    });
    };
    const applyXpSettings = (event) => queryClient.setQueriesData({ queryKey: xpConfigKey }, (current) => current ? { ...current, settings: event.type === 'delete' ? current.settings : { ...current.settings, ...event.data } } : current);
    const offFrames = subscribeEntity('XpFrame', applyXpFrame);
    const offSettings = subscribeEntity('XpSettings', applyXpSettings);
    return () => { offXp(); offFrames(); offSettings(); };
  }, [queryClient]);
  return children;
}