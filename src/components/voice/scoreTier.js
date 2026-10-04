/** Koltuk sayacı eşikleri — 5 milyondan sonra siyah seviyeye geçer. */
export const scoreTier = (value) => {
  if (value >= 5000000) return 'black';
  if (value >= 1000000) return 'yellow';
  if (value >= 300000) return 'pink';
  if (value >= 50000) return 'purple';
  if (value >= 5000) return 'blue';
  return 'default';
};

// Küsürat kısaltılır (yuvarlanmaz): 100.250k → 100.25k, 20.002.650 → 20.002M
const truncate = (scaled, digits) => (Math.floor(scaled * 10 ** digits) / 10 ** digits).toFixed(digits);

/**
 * Sayaç değerini kısa biçime çevirir:
 * bin – 100 bin arası üç küsüratlı (5.500k), 100 bin – 1 milyon arası iki küsüratlı (100.25k),
 * milyon ve üzeri üç küsüratlı (1.150M, 15.670M).
 * Uzun rakamlar koltuk ızgarasını sağa sola kaydırmasın diye bin/milyon birimine indirilir.
 */
export const formatScore = (value) => {
  const n = Math.max(0, Math.round(Number(value) || 0));
  if (n >= 1000000) return `${truncate(n / 1000000, 3)}M`;
  if (n >= 100000) return `${truncate(n / 1000, 2)}k`;
  if (n >= 1000) return `${truncate(n / 1000, 3)}k`;
  return String(n);
};