import { useEffect } from 'react';
import subscribeEntity from '@/components/data/entitySubscriptions';
import useLatestCallback from '@/hooks/useLatestCallback';

/**
 * Cüzdan (GameWallet) kaydı değiştiğinde bakiyeyi anında bildirir.
 * Oyun kazancı, hesaba gelen coin ya da hediye harcaması ekranda beklemeden görünür.
 */
export default function useWalletCoinsLive(userId, onChange) {
  const handle = useLatestCallback(onChange);
  useEffect(() => {
    if (!userId) return undefined;
    return subscribeEntity('GameWallet', (event) => {
      const row = event?.data;
      if (!row || row.user_id !== userId) return;
      handle(Math.max(0, Number(row.coins) || 0));
    });
  }, [userId, handle]);
}