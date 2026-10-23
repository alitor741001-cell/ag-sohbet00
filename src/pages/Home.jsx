import RoomDiscovery from '@/components/home/RoomDiscovery';

/**
 * Ana sayfa: gece mavisi fantastik zemin üzerinde kristal/altın premium tema.
 * Sıra: üst şerit, sekmeler, arama ve canlı odalar.
 */
export default function Home() {
  return (
    <div
      className="relative min-h-screen overflow-x-clip text-white"
      style={{ background: '#040b1c' }}
    >
      {/* Tasarım zemini: koyu lacivert, yanlardan altın/mavi ışık çizgileri. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" style={{
        background: [
          'linear-gradient(145deg, transparent 62%, rgba(255,160,40,0.35) 64%, transparent 66%)',
          'linear-gradient(215deg, transparent 62%, rgba(255,160,40,0.35) 64%, transparent 66%)',
          'linear-gradient(150deg, transparent 55%, rgba(50,120,255,0.35) 57%, transparent 60%)',
          'linear-gradient(210deg, transparent 55%, rgba(50,120,255,0.35) 57%, transparent 60%)',
          'radial-gradient(90% 60% at 50% 35%, #0c2250 0%, #06112a 60%, #040b1c 100%)',
        ].join(','),
      }} />
      <div className="relative z-10 mx-auto w-full max-w-2xl md:max-w-3xl xl:max-w-4xl px-4 pb-10 pt-2 sm:px-6">
        <RoomDiscovery />
      </div>
    </div>
  );
}