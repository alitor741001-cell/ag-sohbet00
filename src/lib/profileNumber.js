// Profil coin/elmas yazımı: en fazla 5 rakam. 999 üstü K (500K), milyon üstü M (12.543M).
function fiveDigits(scaled, suffix) {
  const intLen = String(Math.floor(scaled)).length;
  const decimals = Math.max(0, 5 - intLen);
  const factor = 10 ** decimals;
  const text = (Math.floor(scaled * factor) / factor).toFixed(decimals);
  return `${decimals ? text.replace(/\.?0+$/, '') : text}${suffix}`;
}

export default function profileNumber(amount) {
  const value = Math.max(0, Math.floor(Number(amount) || 0));
  if (value >= 1e6) return fiveDigits(value / 1e6, 'M');
  if (value > 999) return fiveDigits(value / 1e3, 'K');
  return String(value);
}