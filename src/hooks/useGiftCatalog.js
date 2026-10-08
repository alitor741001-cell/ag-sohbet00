/** Hediye tahtası için veri katmanı: katalog, K seviyeleri ve seçim renkleri. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useWalletCoinsLive from '@/hooks/useWalletCoinsLive';
import { base44 } from '@/api/base44Client';
import { tierForK, toneColor, toneGlow } from '@/lib/giftTone';

/** Aktif hediyeleri ve K seviyelerini yükler. */
export function useGiftCatalog() {
  const [gifts, setGifts] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      base44.entities.Gift.filter({ active: true }, 'sort_order', 100).catch(() => []),
      base44.entities.GiftTier.filter({ active: true }, 'sort_order', 50).catch(() => []),
    ]).then(([giftList, tierList]) => {
      if (cancelled) return;
      setGifts(Array.isArray(giftList) ? giftList : []);
      setTiers(Array.isArray(tierList) ? tierList : []);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { gifts, tiers, loading };
}

/** Seçili hediye + alıcı sayısına göre K maliyeti ve renk tonu. */
export function useGiftCost(gift, tiers, recipientCount) {
  const count = Math.max(0, Number(recipientCount) || 0);
  const totalK = (Number(gift?.k_value) || 0) * count;
  return useMemo(() => {
    const tier = tierForK(tiers, gift?.k_value || 0);
    return { count, totalK, tier, color: toneColor(tier), glow: toneGlow(tier) };
  }, [gift?.k_value, totalK, count, tiers]);
}

/** Gönderenin K bakiyesi (coin) — sesli odanın hediye durumundan okunur. */
export function useGiftBalance(roomId, enabled, userId, sendingRef) {
  const [coins, updateCoins] = useState(null);
  const revision = useRef(0);
  const setCoins = useCallback((value) => { revision.current++; updateCoins(value); }, []);
  const refresh = useCallback(() => {
    if (!roomId || sendingRef?.current) return Promise.resolve(null);
    const version = revision.current;
    return base44.functions.invoke('voice-room', { room_id: roomId, action: 'gift-state' }).then(({ data }) => {
      const value = Math.max(0, Number(data?.coins) || 0);
      if (version === revision.current && !sendingRef?.current) setCoins(value);
      return value;
    }).catch(() => null);
  }, [roomId, setCoins, sendingRef]);
  useWalletCoinsLive(userId, (value) => { if (!sendingRef?.current) setCoins(value); });
  useEffect(() => { refresh(); }, [enabled, refresh]);
  useEffect(() => {
    const visible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', visible);
    const timer = setInterval(visible, 8000);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, [refresh]);
  return { coins, setCoins, refresh };
}