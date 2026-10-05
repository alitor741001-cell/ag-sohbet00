import { useEffect } from 'react';

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
  '/ajans': () => import('@/pages/AgencyPage'),
  '/ajans/kazanc': () => import('@/pages/agency/AgencyEarnings'),
  '/ajans/kota-tablosu': () => import('@/pages/agency/AgencyQuota'),
  '/ajans/yayincilar': () => import('@/pages/agency/AgencyBroadcasters'),
  '/ajans/ajansim': () => import('@/pages/agency/AgencyInfo'),
  '/ajans/davetler': () => import('@/pages/agency/AgencyInvites'),
  '/ajans/transferler': () => import('@/pages/agency/AgencyTransfers'),
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

    // Uygulama açıldıktan sonra kalan sayfa paketleri sırayla indirilir; böylece
    // sayfalar arasında gezinirken bekleme ekranı çıkmaz. Yavaş bağlantıda indirilmez.
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const canWarm = !connection?.saveData && !['slow-2g', '2g'].includes(connection?.effectiveType);
    const queue = canWarm ? Object.values(routeLoaders) : [];
    let timer;
    const warmNext = () => {
      queue.shift()?.();
      if (queue.length) timer = window.setTimeout(warmNext, 400);
    };
    if (queue.length) timer = window.setTimeout(warmNext, 1500);

    return () => {
      document.removeEventListener('pointerdown', onIntent);
      document.removeEventListener('pointerover', onIntent);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return null;
}