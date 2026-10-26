import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
export default function useAgOfficial(userId) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['ag-official', userId], enabled: !!userId, queryFn: async () => {
    const page = await base44.entities.AgOfficial.filter({ user_id: userId, active: true }, { limit: 1 });
    return page.items.length > 0;
  }, staleTime: 30000 });
  useEffect(() => subscribeEntity('AgOfficial', () => client.invalidateQueries({ queryKey: ['ag-official'] })), [client]);
  return { active: query.data === true, loading: !!userId && query.isPending };
}