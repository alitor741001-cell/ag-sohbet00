import { useEffect } from 'react';

// Çevrim dışı kalma sınırı: bu süre dolduğunda kişi odadan sessizce çıkarılır.
const OFFLINE_EXIT_MS = 3 * 60 * 1000;

/**
 * Kişi çevrim dışı (ya da uygulama arka planda) kaldığında 3 dakika sonra odadan
 * sessizce çıkar ve ana sayfaya döner: "atıldı" bildirimi, yasak kaydı ve listeye
 * ekleme olmaz. Kural oda sahibini de kapsar.
 */
export default function useOfflineExit({ enabled, onExit }) {
  useEffect(() => {
    if (!enabled) return undefined;
    let timer = null;
    const start = () => {
      if (timer) return;
      timer = window.setTimeout(() => { timer = null; onExit(); }, OFFLINE_EXIT_MS);
    };
    const cancel = () => { if (timer) { window.clearTimeout(timer); timer = null; } };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden' || !navigator.onLine) start();
      else cancel();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', cancel);
    window.addEventListener('offline', start);
    if (document.visibilityState === 'hidden' || !navigator.onLine) start();
    return () => {
      cancel();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', cancel);
      window.removeEventListener('offline', start);
    };
  }, [enabled, onExit]);
}