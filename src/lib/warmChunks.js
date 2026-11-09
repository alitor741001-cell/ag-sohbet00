// Uygulama açıldıktan sonra en sık gidilen ekranlar arka planda hazırlanır.
// Böylece sohbet, destek, odalar ve profil kartı ilk dokunuşta beklemeden açılır.
// Hazırlık ilk ekranın önüne geçmez: tarayıcı gerçekten boşa çıkınca ve yavaş
// bağlantılarda hiç çalışmaz.
const CHUNKS = [
  () => import('@/pages/Friends'),
  () => import('@/pages/SupportEntry'),
  () => import('@/pages/OpenRooms'),
  () => import('@/components/profile/FullUserProfile'),
];

const isSlowNetwork = () => {
  const connection = navigator.connection;
  return !!connection && (connection.saveData || /2g|3g/.test(connection.effectiveType || ''));
};

export default function warmChunks() {
  if (typeof window === 'undefined') return;
  const run = () => {
    if (isSlowNetwork()) return;
    CHUNKS.forEach((load) => { load().catch(() => {}); });
  };
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(run, { timeout: 8000 });
  else window.setTimeout(run, 4000);
}