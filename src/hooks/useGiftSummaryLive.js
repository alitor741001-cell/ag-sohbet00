import { useEffect } from 'react';
import subscribeEntity from '@/components/data/entitySubscriptions';
import useLatestCallback from '@/hooks/useLatestCallback';

export default function useGiftSummaryLive(userId, refresh, active = true) {
  const update = useLatestCallback(refresh);
  useEffect(() => {
    if (!active || !userId) return undefined;
    let timer;
    const off = subscribeEntity('RoomMessage', ({ data }) => {
      if (data?.type !== 'gift' || data.gift_to_id !== userId) return;
      clearTimeout(timer);
      timer = setTimeout(() => update(), 250);
    });
    return () => { off(); clearTimeout(timer); };
  }, [active, userId, update]);
}