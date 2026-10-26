// Uygulama açıldıktan sonra en sık gidilen ekranlar arka planda hazırlanır.
// Böylece sohbet, profil, destek ve profil kartı ilk dokunuşta beklemeden açılır.
const CHUNKS = [
  () => import('@/pages/Friends'),
  () => import('@/pages/Profile'),
  () => import('@/pages/SupportEntry'),
  () => import('@/pages/OpenRooms'),
  () => import('@/components/profile/FullUserProfile'),
];

export default function warmChunks() {
  if (typeof window === 'undefined') return;
  const run = () => CHUNKS.forEach((load) => { load().catch(() => {}); });
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(run, { timeout: 5000 });
  else window.setTimeout(run, 1800);
}