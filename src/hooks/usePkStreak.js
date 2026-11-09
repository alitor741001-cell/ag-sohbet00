import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';

/**
 * Kullanıcının PK galibiyet serisi: hesaba bağlı kayıttan okunur, maç bitince tazelenir.
 * Kayıt değiştiğinde (sonuç işlendiğinde) ekrandaki sayı kendiliğinden güncellenir.
 */
export default function usePkStreak(userId) {
  const [streak, setStreak] = useState(0);

  const load = useCallback(async () => {
    if (!userId) return;
    const page = await base44.entities.PkStreak.filter({ user_id: userId }, { sort: '-created_date', limit: 1 });
    setStreak(Number(page?.items?.[0]?.streak) || 0);
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    load().catch(() => null);
    const off = subscribeEntity('PkStreak', (event) => {
      const data = event?.data;
      if (data?.user_id && data.user_id !== userId) return;
      load().catch(() => null);
    });
    return off;
  }, [userId, load]);

  return { streak, refresh: load };
}