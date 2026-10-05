import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { queryClientInstance } from '@/lib/query-client';

// Her sayfanın paketi: dokunulan an hiç beklemeden açılsın diye arka planda önceden indirilir.
const routeLoaders = {
  '/': () => import('@/pages/Home'),
  '/filmler': () => import('@/pages/Browse'),
  '/kategoriler': () => import('@/pages/Browse'),
  '/acik-odalar': () => import('@/pages/OpenRooms'),
  '/oda-kur': () => import('@/pages/CreateRoom'),
  '/sesli-oda-kur': () => import('@/pages/VoiceRoomCreate'),
  '/sesli-oda': () => import('@/pages/VoiceRoom'),
  '/arkadaslar': () => import('@/pages/Friends'),
  '/listem': () => import('@/pages/MyList'),
  '/ara': () => import('@/pages/Search'),
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
  '/abonelik': () => import('@/pages/Subscription'),
  '/destek': () => import('@/pages/Support'),
  '/odeme-gecmisim': () => import('@/pages/PaymentHistory'),
  '/izle': () => import('@/pages/MovieDetail'),
  '/video': () => import('@/pages/Watch'),
  '/oda': () => import('@/pages/WatchParty'),
  '/kullanici': () => import('@/pages/UserProfile'),
};

// Alt menüdeki ana sayfalar açılışta hemen indirilir: dokunulduğu an hazır olur.
const PRIMARY_ROUTES = ['/', '/filmler', '/acik-odalar', '/oda-kur', '/arkadaslar', '/listem', '/ara', '/profil', '/bildirimler'];

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

    // Ana sayfa verisi de önden yüklenir: ilk açılışta iskelet yerine içerik görünür.
    queryClientInstance.prefetchQuery({
      queryKey: ['home-published-movies'],
      queryFn: () => base44.entities.Movie.filter({ published: true }, '-views', 200),
    });

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