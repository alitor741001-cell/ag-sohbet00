import RoomDiscovery from '@/components/home/RoomDiscovery';

/**
 * Ana sayfa: gece mavisi fantastik zemin üzerinde kristal/altın premium tema.
 * Sıra: üst şerit, sekmeler, arama ve canlı odalar.
 */
export default function Home() {
  return (
    <div
      className="relative min-h-screen overflow-x-clip text-white"
      style={{ background: 'radial-gradient(120% 75% at 50% 0%, #103062 0%, #081a3a 44%, #04081a 100%)' }}
    >
      {/* Arka plan ışıkları: kristal camgöbeği, mor ve altın geçişler. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 -top-28 h-72 w-72 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(79,216,207,0.22), transparent 70%)' }} />
        <div className="absolute -right-20 top-20 h-64 w-64 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(124,92,255,0.22), transparent 70%)' }} />
        <div className="absolute bottom-10 left-1/4 h-64 w-64 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(240,196,105,0.16), transparent 70%)' }} />
      </div>

      <div className="relative mx-auto w-full max-w-2xl md:max-w-3xl xl:max-w-4xl px-4 pb-10 pt-2 sm:px-6">
        <RoomDiscovery />
      </div>
    </div>
  );
}