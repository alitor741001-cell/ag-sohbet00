// Sürüm damgalı varlıklar diskten anında gelir: tekrar açılışlar hızlanır.
// Sayfa ve API istekleri önbelleğe alınmaz, her zaman ağdan gelir.
const CACHE = 'ag-static-v1';
const CACHEABLE = /^\/assets\/.+\.(js|css|woff2?|png|jpg|jpeg|webp|svg)$/;
const ICONS = /^\/apple-touch-ag\.png$|^\/favicon\.ico$|^\/icon-ag-\d+\.png$/;

self.addEventListener('install', (event) => { self.skipWaiting(); });

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('ag-static-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!CACHEABLE.test(url.pathname) && !ICONS.test(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(request);
    if (hit) return hit;
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') cache.put(request, response.clone());
    return response;
  })());
});

self.addEventListener('push', (event) => {
  let data = { title: 'AG', body: '', url: '/' };
  try { data = JSON.parse(event.data.text()); } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-ag-192.png',
      badge: '/icon-ag-192.png',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
