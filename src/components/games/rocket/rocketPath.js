import { ROCKET_BASE } from './rocketConfig';

// Kalkış hazırlığı: motor alevi, gövde titremesi ve kısa dönüş bu sürede olur.
export const IGNITION_S = 0.9;
// Kavisin büyük kısmı ilk saniyelerde alınır, sonrası yavaşlar ama roket hiç durmaz.
const CURVE_S = 13;
const CURVE_SPAN = 0.66;

// Uçuş yolu: kalkış noktasından önce ileri, zamanla yukarı kıvrılan yumuşak kavis.
// Noktalar sahne oranlarıdır (0-1), böylece her ekranda aynı iz çizilir.
export const FLIGHT_CURVE = {
  start: { x: 0.34, y: 0.86 },
  control: { x: 0.62, y: 0.79 },
  end: { x: 0.88, y: 0.15 },
};

const clamp01 = (value) => Math.min(1, Math.max(0, value || 0));

// Kalkıştan sonraki saniye → 0..1 ilerleme. Zamanla akar; roket hiçbir an durmaz.
export function flightProgress(seconds) {
  const s = Math.max(0, seconds || 0);
  if (s <= CURVE_S) return CURVE_SPAN * Math.pow(s / CURVE_S, 0.85);
  return CURVE_SPAN + (1 - CURVE_SPAN) * (1 - Math.exp(-(s - CURVE_S) / 20));
}

// Kavisin teğet yönü (ekran pikseli cinsinden, normalize edilmiş).
export function flightDir(progress, width, height) {
  const p = clamp01(progress);
  const u = 1 - p;
  const { start, control, end } = FLIGHT_CURVE;
  const dx = (2 * u * (control.x - start.x) + 2 * p * (end.x - control.x)) * (width || 1);
  const dy = (2 * u * (control.y - start.y) + 2 * p * (end.y - control.y)) * (height || 1);
  const len = Math.hypot(dx, dy) || 1;
  return { dx: dx / len, dy: dy / len };
}

// p = 0..1 arası ilerleme için Bezier noktası.
export function flightPoint(progress) {
  const p = clamp01(progress);
  const u = 1 - p;
  const { start, control, end } = FLIGHT_CURVE;
  return {
    x: u * u * start.x + 2 * u * p * control.x + p * p * end.x,
    y: u * u * start.y + 2 * u * p * control.y + p * p * end.y,
  };
}

// Gövde uçuş yönüne döner (sprite yukarı baktığı için 90 derece eklenir).
export function flightAngle(progress, width, height) {
  const { dx, dy } = flightDir(progress, width, height);
  return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
}

// Çarpanın kalkıştan sonraki saniye karşılığı: m = ROCKET_BASE^(saniye).
export function secondsForMult(mult) {
  return Math.max(0, Math.log(Math.max(1, mult || 1)) / Math.log(ROCKET_BASE));
}

// Bir çarpanın uçuş alanındaki konumu: çekilen oyuncunun profili buraya sabitlenir.
export function pointForMult(mult) {
  return flightPoint(flightProgress(secondsForMult(mult) - IGNITION_S));
}