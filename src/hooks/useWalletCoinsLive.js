import { useEffect } from 'react';
import subscribeEntity from '@/components/data/entitySubscriptions';
import useLatestCallback from '@/hooks/useLatestCallback';

/**
 * Cüzdan (GameWallet) kaydı değiştiğinde bakiyeyi anında bildirir.
 * Oyun kazancı, hesaba gelen coin ya da hediye harcaması ekranda beklemeden görünür.
 */
export function publishWalletCoins(userId, coins) {
  window.dispatchEvent(new CustomEvent('wallet-coins-confirmed', { detail: { userId, coins } }));
}

export default function useWalletCoinsLive(userId, onChange) {
  const handle = useLatestCallback(onChange);
  useEffect(() => {
    if (!userId) return undefined;
    const local = (event) => { if (event.detail?.userId === userId) handle(event.detail.coins); };
    window.addEventListener('wallet-coins-confirmed', local);
    const off = subscribeEntity('GameWallet', (event) => {
      const row = event?.data;
      if (!row || row.user_id !== userId) return;
      handle(Math.max(0, Number(row.coins) || 0));
    });
    return () => { off(); window.removeEventListener('wallet-coins-confirmed', local); };
  }, [userId, handle]);
}