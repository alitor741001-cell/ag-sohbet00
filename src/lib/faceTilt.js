/**
 * Telefonun yukarı-aşağı çevrilmesini izler (Face ID hissi).
 *
 * iOS yalnızca kullanıcı dokunuşuyla izin verir; izin verilmezse hiçbir şey
 * bozulmaz — tarama kendi süresiyle ilerler.
 */
export async function requestTiltPermission() {
  try {
    const api = typeof window !== 'undefined' ? window.DeviceOrientationEvent : null;
    if (!api) return false;
    if (typeof api.requestPermission === 'function') {
      const state = await api.requestPermission();
      return state === 'granted';
    }
    return true;
  } catch {
    return false;
  }
}

/** Çevirme miktarını derece olarak bildirir; durdurmak için dönen fonksiyon çağrılır. */
export function watchTilt(handler) {
  if (typeof window === 'undefined') return () => {};
  let last = null;
  const onEvent = (event) => {
    const beta = typeof event.beta === 'number' ? event.beta : null;
    if (beta === null) return;
    if (last !== null) {
      const delta = Math.abs(beta - last);
      if (delta > 0) handler(delta);
    }
    last = beta;
  };
  window.addEventListener('deviceorientation', onEvent, true);
  return () => window.removeEventListener('deviceorientation', onEvent, true);
}