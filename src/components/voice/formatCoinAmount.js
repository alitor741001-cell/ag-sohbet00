/** Compact coin display: 100K, 200K, 1M, 1.350M, 20.550M. */
export default function formatCoinAmount(coins) {
  const value = Math.max(0, Math.floor(Number(coins) || 0));
  if (value < 1000) return String(value);
  if (value < 1000000) return `${Number((value / 1000).toFixed(3))}K`;
  if (value % 1000000 === 0) return `${value / 1000000}M`;
  return `${(Math.floor(value / 1000) / 1000).toFixed(3)}M`;
}