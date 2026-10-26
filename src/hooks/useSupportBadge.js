import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useAgOfficial from '@/hooks/useAgOfficial';
import { useCurrentUser } from '@/lib/useCurrentUser';
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
    const refresh = () => client.invalidateQueries({ queryKey: ['support-unread', userId] });
    window.addEventListener('destek-goruldu', refresh);
    window.addEventListener('destek-rozet-tazele', refresh);
    return () => { window.removeEventListener('destek-goruldu', refresh); window.removeEventListener('destek-rozet-tazele', refresh); };
  }, [client, userId]);
  return query.data || 0;
}