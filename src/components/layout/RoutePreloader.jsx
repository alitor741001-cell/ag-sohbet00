import { useEffect } from 'react';

// Her sayfanın paketi: dokunulan an hiç beklemeden açılsın diye arka planda önceden indirilir.
const routeLoaders = {
  '/': () => import('@/pages/Home'),
  '/acik-odalar': () => import('@/pages/OpenRooms'),
  '/oda-kur': () => import('@/pages/CreateRoom'),
  '/sesli-oda-kur': () => import('@/pages/VoiceRoomCreate'),
  '/sesli-oda': () => import('@/pages/VoiceRoom'),
  '/arkadaslar': () => import('@/pages/Friends'),
  '/profil': () => import('@/pages/Profile'),
  '/bildirimler': () => import('@/pages/Notifications'),
  '/ajans': () => import('@/pages/AgencyPage'),
  '/ajans/kazanc': () => import('@/pages/agency/AgencyEarnings'),
  '/ajans/kota-tablosu': () => import('@/pages/agency/AgencyQuota'),
  '/ajans/yayincilar': () => import('@/pages/agency/AgencyBroadcasters'),
  '/ajans/asistanlar': () => import('@/pages/agency/AgencyAssistants'),
  '/ajans/ajansim': () => import('@/pages/agency/AgencyInfo'),
  '/ajans/davetler': () => import('@/pages/agency/AgencyInvites'),
  '/ajans/transferler': () => import('@/pages/agency/AgencyTransfers'),
  '/destek': () => import('@/pages/Support'),
  '/oda': () => import('@/pages/WatchParty'),
  '/kullanici': () => import('@/pages/UserProfile'),
};

// Alt menüdeki ana sayfalar açılışta hemen indirilir: dokunulduğu an hazır olur.
const PRIMARY_ROUTES = ['/', '/acik-odalar', '/oda-kur', '/arkadaslar', '/profil', '/bildirimler'];

const preload = (path) => {
  const cleanPath = path.split('?')[0];
  const key = Object.keys(routeLoaders)
    .filter((route) => route === cleanPath || (route !== '/' && cleanPath.startsWith(`${route}/`)))
    .sort((a, b) => b.length - a.length)[0];
  routeLoaders[key]?.();
};

export default function RoutePreloader() {
  useEffect(() => {
    // Açık sayfa hemen iner; kalan paketler sırayla, açılışı yavaşlatmadan indirilir.
    preload(window.location.pathname);

    const onIntent = (event) => {
      const anchor = event.target.closest?.('a[href]');
      if (anchor?.origin === window.location.origin) preload(anchor.pathname);
    };
    document.addEventListener('pointerdown', onIntent, { passive: true });
    document.addEventListener('pointerover', onIntent, { passive: true });

    // Yavaş bağlantıda arka plan indirmesi yapılmaz.
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const canWarm = !connection?.saveData && !['slow-2g', '2g'].includes(connection?.effectiveType);
    const queue = canWarm
      ? Object.keys(routeLoaders).filter((path) => !PRIMARY_ROUTES.includes(path)).map((path) => routeLoaders[path])
      : [];
    const idle = window.requestIdleCallback ? window.requestIdleCallback.bind(window) : (callback) => window.setTimeout(callback, 800);
    const cancelIdle = window.cancelIdleCallback ? window.cancelIdleCallback.bind(window) : window.clearTimeout;

    let primaryTimer = 0;
    let warmTimer = 0;
    let idleHandle = 0;

    // Ana sekmeler sırayla, kısa aralıklarla ısıtılır: ilk boyama bant genişliğini paylaşmaz.
    const primaryQueue = PRIMARY_ROUTES
      .filter((path) => path !== window.location.pathname)
      .map((path) => routeLoaders[path]);
    const warmPrimary = () => {
      primaryQueue.shift()?.();
      if (primaryQueue.length) primaryTimer = window.setTimeout(warmPrimary, 400);
    };
    primaryTimer = window.setTimeout(warmPrimary, 1200);

    // Kalan paketler açılıştan sonra, tarayıcı boşa çıktığında teker teker indirilir.
    const warmNext = () => {
      queue.shift()?.();
      if (queue.length) idleHandle = idle(warmNext, { timeout: 8000 });
    };
    if (queue.length) warmTimer = window.setTimeout(() => { idleHandle = idle(warmNext, { timeout: 8000 }); }, 6000);

    return () => {
      document.removeEventListener('pointerdown', onIntent);
      document.removeEventListener('pointerover', onIntent);
      window.clearTimeout(primaryTimer);
      window.clearTimeout(warmTimer);
      if (idleHandle) cancelIdle(idleHandle);
    };
  }, []);

  return null;
}