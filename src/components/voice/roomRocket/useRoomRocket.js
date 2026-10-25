import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';

export default function useRoomRocket(room, details) {
  const client = useQueryClient();
  const id = room?.id;
  const gift = room?.gift_requests?.at(-1);
  const query = useQuery({
    queryKey: ['room-rocket', id, details],
    enabled: !!id,
    queryFn: async () => (await base44.functions.invoke('roomRocket', { room_id: id, details })).data,
    staleTime: 15000,
    placeholderData: previous => previous,
    refetchInterval: details ? 15000 : 60000,
    retry: 1,
  });
  useEffect(() => {
    if (!id) return;
    return subscribeEntity('RoomRocketState', event => {
      if (event.data?.room_id === id) client.invalidateQueries({ queryKey: ['room-rocket', id] });
    });
  }, [id, client]);
  useEffect(() => {
    if (!id || !gift) return;
    const timer = setTimeout(() => client.invalidateQueries({ queryKey: ['room-rocket', id] }), 800);
    return () => clearTimeout(timer);
  }, [id, gift, client]);
  return query;
}