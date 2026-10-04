import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

/** Slot oyunundaki coin bakiyesi — slot oyununun kendi durumundan okunur. */
export default function useSlotCoins() {
  const [coins, setCoins] = useState(null);

  const refresh = useCallback(() => {
    base44.functions.invoke('slot-game', { action: 'state' })
      .then((response) => setCoins(Number(response.data?.coins) || 0))
      .catch(() => {});
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { coins, refresh };
}