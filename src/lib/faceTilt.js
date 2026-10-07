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

/** Telefonun duruş açılarını (yukarı-aşağı beta, sağ-sol gamma) bildirir. */
export function watchOrientation(handler) {
  if (typeof window === 'undefined') return () => {};
  const onEvent = (event) => {
    const beta = typeof event.beta === 'number' ? event.beta : null;
    const gamma = typeof event.gamma === 'number' ? event.gamma : null;
    if (beta === null || gamma === null) return;
    handler({ beta, gamma });
  };
  window.addEventListener('deviceorientation', onEvent, true);
  return () => window.removeEventListener('deviceorientation', onEvent, true);
}