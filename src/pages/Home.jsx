import RoomDiscovery from '@/components/home/RoomDiscovery';

// Ana sayfa: canlı oda keşfet ızgarası (koltuklu odalar ve film odaları).
export default function Home() {
  return (
    <div className="min-h-screen bg-catalog px-4 py-5 text-white sm:px-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-extrabold">FILMKEYFİ</h1>
        <RoomDiscovery />
      </div>
    </div>
  );
}