// Gerçek makara hareketi (Şeker, Dede, Meyve, Şekerli Meyve, ELİMİNSLOT ortak).
// Birimler satır ve milisaniyedir. Bant aşağı akar: yeni semboller yukarıdan gelir.

// Tam hız: saniyede 22 sembol.
export const SPEED = 0.022;
// Kalkış: makara önce hafifçe yukarı çekilir, sonra hızlanarak aşağı akar.
const PULL_MS = 110;
const PULL_ROWS = 0.3;
const ACCEL_MS = 260;
// Makaralar soldan sağa bu aralıklarla kalkar ve durur.
export const START_GAP_MS = 45;
export const STOP_GAP_MS = 170;
// Sonuç erken gelse de ilk makara bu süre dolmadan durmaz.
export const MIN_SPIN_MS = 800;
// Duruş: makara hedefi bu kadar geçer, sonra geri sekip yerine oturur.
const OVERSHOOT_ROWS = 0.28;
const BOUNCE_MS = 170;
// Fren yolu hedefi: sonuç ile ekrandaki semboller arasına giren dolgu buna göre seçilir.
const BRAKE_ROWS = 5.2;

/** Kalkıştan bu yana alınan yol (satır; eksi değer geri çekilmedir). */
export function spinDistance(t) {
  if (t <= 0) return 0;
  if (t < PULL_MS) return -PULL_ROWS * Math.sin((Math.PI / 2) * (t / PULL_MS));
  const run = t - PULL_MS;
  if (run < ACCEL_MS) return -PULL_ROWS + (SPEED * run * run) / (2 * ACCEL_MS);
  return -PULL_ROWS + (SPEED * ACCEL_MS) / 2 + SPEED * (run - ACCEL_MS);
}

const bridgeFor = (rows, frac) => Math.max(0, Math.round(BRAKE_ROWS - OVERSHOOT_ROWS - rows - frac));
// Fren süresi yoldan çıkar: makara frene tam hızda girer, hız sıçramaz.
const brakeFor = (distance) => (2 * (distance + OVERSHOOT_ROWS)) / SPEED;

/** Duruş planı: araya giren dolgu sayısı, hedefe kalan yol ve fren süresi. */
export function stopPlan(rows, frac) {
  const bridge = bridgeFor(rows, frac);
  const distance = rows + bridge + frac;
  return { bridge, distance, brake: brakeFor(distance) };
}

/** Duruşun başından u ms sonra hedefe kalan yol (eksi: hedefi geçti, geri sekiyor). */
export function stopOffset(plan, u) {
  if (u <= 0) return plan.distance;
  if (u < plan.brake) {
    const s = u / plan.brake;
    return plan.distance - (plan.distance + OVERSHOOT_ROWS) * (2 * s - s * s);
  }
  const back = Math.min(1, (u - plan.brake) / BOUNCE_MS);
  return -OVERSHOOT_ROWS * (0.5 + 0.5 * Math.cos(Math.PI * back));
}

export const stopDone = (plan, u) => u >= plan.brake + BOUNCE_MS;

/**
 * Sonuç geldikten sonra oyunun bekleyeceği süre: en kısa dönüşün kalanı,
 * makaraların sırayla duruşu ve son makaranın sekmesi.
 */
export function landWait(reels, rows, startedAt) {
  const rest = Math.max(0, MIN_SPIN_MS - (Date.now() - startedAt));
  const longestBrake = brakeFor(rows + bridgeFor(rows, 0) + 1);
  return rest + (reels - 1) * STOP_GAP_MS + longestBrake + BOUNCE_MS + 80;
}