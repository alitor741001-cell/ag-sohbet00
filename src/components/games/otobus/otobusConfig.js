// OTOBÜS ROKET arayüz ayarları. Tur motoru, bahis kademeleri ve sunucu sözleşmesi
// Crash Rocket ile ortaktır: aynı canlı tur, aynı cüzdan, aynı ödeme kuralları.
export const OTOBUS_BET_PRESETS = [500, 2500, 25000, 250000];
export const OTOBUS_AUTO_PRESETS = [0, 1.5, 2, 5, 10];

// Kamera: otobüs ekranda sabit durur, savana arkasından sola akar. Kayma yolun
// başında yumuşak, çarpan büyüdükçe belirginleşir ve sınırlı kalır — manzara
// hiçbir an ekranın dışına taşmaz.
const PAN_START = 5;
const PAN_SPAN = 13;

/** Yolculuk ilerlemesi (0-1): çarpan büyüdükçe otobüs hızlanır. */
export function rideProgress(mult) {
  const extra = Math.max(0, (mult || 1) - 1);
  return 1 - 1 / (1 + Math.log(1 + extra) / 1.1);
}

/** Kameranın kayacağı mesafe: kendi genişliğinin yüzdesi. */
export function panPercent(progress) {
  return PAN_START + Math.max(0, Math.min(1, progress || 0)) * PAN_SPAN;
}