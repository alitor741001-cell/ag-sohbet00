import { useEffect } from 'react';

const routeLoaders = {
  '/': () => import('@/pages/Home'),
  '/filmler': () => import('@/pages/Browse'),
  '/acik-odalar': () => import('@/pages/OpenRooms'),
  '/oda-kur': () => import('@/pages/CreateRoom'),
  '/arkadaslar': () => import('@/pages/Friends'),
  '/listem': () => import('@/pages/MyList'),
  '/ara': () => import('@/pages/Search'),
  '/profil': () => import('@/pages/Profile'),
  '/abonelik': () => import('@/pages/Subscription'),
  '/bildirimler': () => import('@/pages/Notifications'),
  '/destek': () => import('@/pages/Support'),
  '/odeme-gecmisim': () => import('@/pages/PaymentHistory'),
  '/izle': () => import('@/pages/MovieDetail'),
  '/video': () => import('@/pages/Watch'),
  '/oda': () => import('@/pages/WatchParty'),
  '/kullanici': () => import('@/pages/UserProfile'),
};

const preload = (path) => {
  const cleanPath = path.split('?')[0];
  const key = Object.keys(routeLoaders)
    .filter((route) => route === cleanPath || (route !== '/' && cleanPath.startsWith(`${route}/`)))
    .sort((a, b) => b.length - a.length)[0];
  routeLoaders[key]?.();
};

export default function RoutePreloader() {
  useEffect(() => {
    const onIntent = (event) => {
      const anchor = event.target.closest?.('a[href]');
      if (anchor?.origin === window.location.origin) preload(anchor.pathname);
    };
    document.addEventListener('pointerdown', onIntent, { passive: true });
    document.addEventListener('pointerover', onIntent, { passive: true });
    const preloadAll = () => Object.values(routeLoaders).forEach((load) => load());
    const idleId = window.requestIdleCallback
      ? window.requestIdleCallback(preloadAll, { timeout: 1500 })
      : window.setTimeout(preloadAll, 500);

    return () => {
      document.removeEventListener('pointerdown', onIntent);
      document.removeEventListener('pointerover', onIntent);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };
  }, []);

  return null;
}