const loaders = {
  '/': () => import('@/pages/Home'),
  '/acik-odalar': () => import('@/pages/OpenRooms'),
  '/oda-kur': () => import('@/pages/CreateRoom'),
  '/sesli-oda-kur': () => import('@/pages/VoiceRoomCreate'),
  '/sesli-oda': () => import('@/pages/VoiceRoom'),
  '/arkadaslar': () => import('@/pages/Friends'),
  '/bildirimler': () => import('@/pages/Notifications'),
  '/ajans': () => import('@/pages/AgencyPage'),
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
const pending = new Map();
export default function preloadRoute(path) {
  const clean = path.split('?')[0];
  const key = Object.keys(loaders).filter(route => route === clean || (route !== '/' && clean.startsWith(`${route}/`))).sort((a, b) => b.length - a.length)[0];
  if (!key) return Promise.resolve();
  if (!pending.has(key)) pending.set(key, loaders[key]().catch(() => { pending.delete(key); }));
  return pending.get(key);
}