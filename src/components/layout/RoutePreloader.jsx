import { useEffect } from 'react';
import preloadRoute from '@/lib/routePreload';

export default function RoutePreloader() {
  useEffect(() => {
    preloadRoute(window.location.pathname);
    const onIntent = event => {
      const anchor = event.target.closest?.('a[href]');
      if (anchor?.origin === window.location.origin) preloadRoute(anchor.pathname);
    };
    document.addEventListener('pointerdown', onIntent, { passive: true });
    document.addEventListener('pointerover', onIntent, { passive: true });
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const warm = !connection?.saveData && !['slow-2g', '2g', '3g'].includes(connection?.effectiveType);
    const queue = warm ? ['/', '/arkadaslar', '/profil', '/bildirimler'].filter(path => path !== window.location.pathname) : [];
    let cancelled = false, timer = 0, idle = 0;
    const next = () => {
      if (cancelled || !queue.length || document.visibilityState === 'hidden') return;
      const load = async () => {
        if (cancelled) return;
        await preloadRoute(queue.shift());
        if (!cancelled && queue.length) timer = window.setTimeout(next, 1200);
      };
      if (window.requestIdleCallback) idle = window.requestIdleCallback(load, { timeout: 5000 });
      else timer = window.setTimeout(load, 1200);
    };
    if (queue.length) timer = window.setTimeout(next, 4000);
    return () => {
      cancelled = true;
      document.removeEventListener('pointerdown', onIntent);
      document.removeEventListener('pointerover', onIntent);
      window.clearTimeout(timer);
      if (idle) window.cancelIdleCallback?.(idle);
    };
  }, []);
  return null;
}