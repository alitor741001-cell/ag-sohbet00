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

    // Toplu chunk indirme mobil cihazlarda açılışı ve ilk dokunuşları bloke eder.
    // Masaüstünde ise yalnızca tarayıcı gerçekten boş kaldığında arka planda ısıt.
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const canWarmInBackground = window.matchMedia('(min-width: 1024px)').matches
      && !connection?.saveData
      && !['slow-2g', '2g'].includes(connection?.effectiveType);
    const loaders = canWarmInBackground ? Object.values(routeLoaders) : [];
    let idleId;
    let timeoutId;
    const warmNext = (deadline) => {
      if (loaders.length && (deadline?.timeRemaining?.() > 8 || deadline?.didTimeout)) loaders.shift()();
      if (loaders.length) scheduleWarm();
    };
    const scheduleWarm = () => {
      if (window.requestIdleCallback) idleId = window.requestIdleCallback(warmNext, { timeout: 4000 });
      else timeoutId = window.setTimeout(() => { loaders.shift()?.(); if (loaders.length) scheduleWarm(); }, 1200);
    };
    if (loaders.length) scheduleWarm();

    return () => {
      document.removeEventListener('pointerdown', onIntent);
      document.removeEventListener('pointerover', onIntent);
      if (idleId && window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  return null;
}