// Kısa coin yazımı: 300K, 234.54M, 1.2B — en fazla iki ondalık, sıfırlar atılır.
const UNITS = [
  { value: 1e12, suffix: 'T' },
  { value: 1e9, suffix: 'B' },
  { value: 1e6, suffix: 'M' },
  { value: 1e3, suffix: 'K' },
];

export default function compactCoins(amount) {
  const value = Math.max(0, Math.floor(Number(amount) || 0));
  const unit = UNITS.find((entry) => value >= entry.value);
  if (!unit) return String(value);
  const scaled = Math.floor((value / unit.value) * 100) / 100;
  return `${String(scaled.toFixed(2)).replace(/\.?0+$/, '')}${unit.suffix}`;
}