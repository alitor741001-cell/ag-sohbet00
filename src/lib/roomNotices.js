/**
 * Oda bildirim süzgeci: hediye, müzik, odadan ayrılma, koltuk, mikrofon işlemleri ve
 * oyun kazançları bildirim alanında hiç görünmez — alan yalnızca sohbeti ve seviye haberlerini taşır.
 */
const QUIET_PATTERNS = [
  /odaya müzik açtı/i,
  /müziği (durdur|duraklat|kapatt)/i,
  /odadan ayrıldı/i,
  /koltuk/i,
  /mikrofon/i,
  /sessize (aldı|alındı)/i,
  /sustur/i,
];

export default function isQuietNotice(message) {
  if (!message) return false;
  if (message.type === 'gift') return true;
  // Oyunlardan kazanılan ödüller oda bildirim alanına düşmez.
  if (message.type === 'slot_win') return true;
  if (message.type !== 'system') return false;
  const text = String(message.text || '');
  return QUIET_PATTERNS.some((pattern) => pattern.test(text));
}