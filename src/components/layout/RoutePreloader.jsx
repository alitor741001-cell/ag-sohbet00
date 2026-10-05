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
    // Açık sayfa ve ana sekmeler önceliklidir; kalan paketler arkada indirilir.
    preload(window.location.pathname);
    PRIMARY_ROUTES.forEach((path) => routeLoaders[path]?.());

    const onIntent = (event) => {
      const anchor = event.target.closest?.('a[href]');
      if (anchor?.origin === window.location.origin) preload(anchor.pathname);
    };
    document.addEventListener('pointerdown', onIntent, { passive: true });
    document.addEventListener('pointerover', onIntent, { passive: true });

    // Yavaş bağlantıda kalan paketler indirilmez.
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const canWarm = !connection?.saveData && !['slow-2g', '2g'].includes(connection?.effectiveType);
    const queue = canWarm
      ? Object.keys(routeLoaders).filter((path) => !PRIMARY_ROUTES.includes(path)).map((path) => routeLoaders[path])
      : [];
    let timer;
    const warmNext = () => {
      queue.shift()?.();
      if (queue.length) timer = window.setTimeout(warmNext, 250);
    };
    if (queue.length) timer = window.setTimeout(warmNext, 900);

    return () => {
      document.removeEventListener('pointerdown', onIntent);
      document.removeEventListener('pointerover', onIntent);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return null;
}