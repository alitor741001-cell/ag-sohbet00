/** Koltuk sayacı eşikleri — 5 milyondan sonra siyah seviyeye geçer. */
export const scoreTier = (value) => {
  if (value >= 5000000) return 'black';
  if (value >= 1000000) return 'yellow';
  if (value >= 300000) return 'pink';
  if (value >= 50000) return 'purple';
  if (value >= 5000) return 'blue';
  return 'default';
};

// Küsürat kısaltılır (yuvarlanmaz): 20.002.650 → 20.002M
const truncate3 = (scaled) => (Math.floor(scaled * 1000) / 1000).toFixed(3);

/**
 * Sayaç değerini kısa biçime çevirir: 5.530K, 550.000K, 1.537M, 20.002M.
 * Uzun rakamlar koltuk ızgarasını sağa sola kaydırmasın diye bin/milyon birimine indirilir.
 */
export const formatScore = (value) => {
  const n = Math.max(0, Math.round(Number(value) || 0));
  if (n >= 1000000) return `${truncate3(n / 1000000)}M`;
  if (n >= 1000) return `${truncate3(n / 1000)}K`;
  return String(n);
};