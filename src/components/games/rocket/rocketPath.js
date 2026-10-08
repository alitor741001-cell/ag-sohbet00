// Mekiğin uçuş yolu: sol alttan sağ yukarıya doğru yumuşak bir kavis.
// Noktalar sahne oranlarıdır (0-1), böylece her ekranda aynı iz çizilir.
export const FLIGHT_CURVE = {
  start: { x: 0.44, y: 0.9 },
  control: { x: 0.52, y: 0.4 },
  end: { x: 0.93, y: 0.13 },
};

// t = 0..1 arası ilerleme için Bezier noktası.
export function flightPoint(t) {
  const p = Math.min(1, Math.max(0, t || 0));
  const u = 1 - p;
  const { start, control, end } = FLIGHT_CURVE;
  return {
    x: u * u * start.x + 2 * u * p * control.x + p * p * end.x,
    y: u * u * start.y + 2 * u * p * control.y + p * p * end.y,
  };
}

// Yolun teğet açısı: mekik gövdesi uçuş yönüne döner.
export function flightAngle(t, width, height) {
  const p = Math.min(1, Math.max(0, t || 0));
  const u = 1 - p;
  const { start, control, end } = FLIGHT_CURVE;
  const dx = (2 * u * (control.x - start.x) + 2 * p * (end.x - control.x)) * (width || 1);
  const dy = (2 * u * (control.y - start.y) + 2 * p * (end.y - control.y)) * (height || 1);
  // Sprite yukarı baktığı için yön vektörü 90 derece döndürülür.
  return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
}