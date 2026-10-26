import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useAgOfficial from '@/hooks/useAgOfficial';
import { useCurrentUser } from '@/lib/useCurrentUser';
import subscribeEntity from '@/components/data/entitySubscriptions';
import isMessageNotification from '@/lib/messageNotification';
export default function useSupportBadge(userId) {
  const { user } = useCurrentUser();
  const official = useAgOfficial(userId);
  const client = useQueryClient();
  const staff = user?.role === 'admin' || official.active;
  const query = useQuery({ queryKey: ['support-unread', userId, staff], enabled: !!userId && !official.loading,
    queryFn: async () => {
      const since = localStorage.getItem(`destek-okundu:${userId}`) || new Date(0).toISOString();
      if (staff) return (await base44.functions.invoke('officialSupport', { action: 'badge', since })).data.count;
      return base44.entities.SupportMessage.count({ owner_id: userId, sender: 'admin', created_date: { $gt: since } });
    }, refetchInterval: 10000, staleTime: 5000 });
  useEffect(() => {
    if (!userId) return;
    const refresh = () => client.invalidateQueries({ queryKey: ['support-unread', userId] });
    const offMessage = subscribeEntity('SupportMessage', event => { if (staff || event.data?.owner_id === userId) refresh(); });
    const offNotification = subscribeEntity('Notification', event => { if (event.data?.user_id === userId && event.data?.type !== 'dm' && isMessageNotification(event.data)) refresh(); });
    window.addEventListener('destek-goruldu', refresh);
    window.addEventListener('destek-rozet-tazele', refresh);
    return () => { offMessage(); offNotification(); window.removeEventListener('destek-goruldu', refresh); window.removeEventListener('destek-rozet-tazele', refresh); };
  }, [client, userId, staff]);
  return query.data || 0;
}