import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import subscribeEntity from '@/components/data/entitySubscriptions';

export default function useProfileFriendship(userId) {
  const { user } = useCurrentUser();
  const client = useQueryClient();
  const key = ['profile-friendship', user?.id, userId];
  const enabled = !!user?.id && !!userId && user.id !== userId;
  const query = useQuery({
    queryKey: key, enabled,
    queryFn: async () => {
      const page = await base44.entities.Friendship.filter({ $or: [
        { requester_id: user.id, recipient_id: userId },
        { requester_id: userId, recipient_id: user.id },
      ] }, { sort: '-created_date', limit: 1 });
      return page.items[0] || null;
    },
  });
  useEffect(() => {
    if (!enabled) return;
    return subscribeEntity('Friendship', event => {
      if (event.id === query.data?.id || event.data?.members?.includes(userId)) {
        client.invalidateQueries({ queryKey: ['profile-friendship', user.id, userId] });
      }
    });
  }, [enabled, user?.id, userId, query.data?.id, client]);
  return { friendship: query.data, loading: enabled && query.isPending, error: query.error, refresh: query.refetch };
}