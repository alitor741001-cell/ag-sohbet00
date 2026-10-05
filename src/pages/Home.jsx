import RoomDiscovery from '@/components/home/RoomDiscovery';

/**
 * Ana sayfa: koyu antrasit zemin üzerinde altın + kırmızı premium tema.
 * Sıra: kategoriler, arama ve canlı odalar.
 */
export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-anthracite text-white">
      {/* Arka plan ışıkları: saf siyah yerine antrasit zemin, üstünde çok hafif altın/kırmızı geçişler. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-premium-red/10 blur-3xl" />
        <div className="absolute -right-20 top-20 h-64 w-64 rounded-full bg-premium-gold/10 blur-3xl" />
        <div className="absolute bottom-10 left-1/4 h-64 w-64 rounded-full bg-premium-gold-deep/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-2xl px-4 pb-10 pt-2 sm:px-6">
        <RoomDiscovery />
      </div>
    </div>
  );
}