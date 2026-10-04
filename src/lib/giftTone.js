/** Hediye tahtası renk sistemi: K değeri eşiklerini (GiftTier) renge çevirir. */

export const K_UNIT = 1000;

/** K değerini okunur biçime çevirir: 500 → "500K". */
export const formatK = (kValue) => {
  const value = Math.max(0, Math.round(Number(kValue) || 0));
  return `${value.toLocaleString('tr-TR')}K`;
};

/** Coin bakiyesini K değerine çevirir. */
export const coinToK = (coins) => Math.floor((Number(coins) || 0) / K_UNIT);

/** K değerine uyan en yüksek seviye (renk/efekt) — eşikler admin panelden yönetilir. */
export const tierForK = (tiers, kValue) => {
  const k = Number(kValue) || 0;
  const list = (Array.isArray(tiers) ? tiers : [])
    .filter((tier) => tier?.active !== false && k >= (Number(tier.min_k) || 0))
    .sort((a, b) => (Number(b.min_k) || 0) - (Number(a.min_k) || 0));
  return list[0] || null;
};

/** Seviyenin ana rengi. */
export const toneColor = (tier) => tier?.color || '#ef4444';

/** Seviyenin parlama rengi. */
export const toneGlow = (tier) => tier?.glow || toneColor(tier);