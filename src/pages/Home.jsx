import RoomDiscovery from '@/components/home/RoomDiscovery';

/**
 * Ana sayfa: gece mavisi fantastik zemin üzerinde kristal/altın premium tema.
 * Sıra: üst şerit, sekmeler, arama ve canlı odalar.
 */
export default function Home() {
  return (
    <div
      className="relative min-h-screen overflow-x-clip text-white"
      style={{ background: '#050d22 url(https://media.base44.com/images/public/6a77d66e4da6de214628ee62/6524055e8_generated_image.png) center / cover fixed no-repeat' }}
    >
      <div className="relative mx-auto w-full max-w-2xl md:max-w-3xl xl:max-w-4xl px-4 pb-10 pt-2 sm:px-6">
        <RoomDiscovery />
      </div>
    </div>
  );
}