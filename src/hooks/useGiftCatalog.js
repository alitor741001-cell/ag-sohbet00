/** Hediye tahtası için veri katmanı: katalog, K seviyeleri ve seçim renkleri. */
import { useCallback, useEffect, useMemo, useState } from 'react';
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
export function useGiftBalance(roomId, enabled) {
  const [coins, setCoins] = useState(null);

  const refresh = useCallback(() => {
    if (!roomId) return;
    base44.functions.invoke('voice-room', { room_id: roomId, action: 'gift-state' })
      .then((response) => setCoins(Math.max(0, Number(response.data?.coins) || 0)))
      .catch(() => {});
  }, [roomId]);

  useEffect(() => { if (enabled) refresh(); }, [enabled, refresh]);

  return { coins, setCoins, refresh };
}