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
        backgroundImage: 'url(https://media.base44.com/images/public/6a77d66e4da6de214628ee62/a5c5853e0_IMG_0141.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }} />
      <div className="relative z-10 mx-auto w-full max-w-2xl md:max-w-3xl xl:max-w-4xl px-4 pb-10 pt-2 sm:px-6">
        <RoomDiscovery />
      </div>
    </div>
  );
}