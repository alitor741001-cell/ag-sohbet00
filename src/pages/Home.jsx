import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import RoomDiscovery from '@/components/home/RoomDiscovery';
import EmptyRoomsArt from '@/components/home/EmptyRoomsArt';
import DesignBottomNav, { NAV_HEIGHT } from '@/components/layout/DesignBottomNav';
import HomeTopBar from '@/components/layout/HomeTopBar';
import NeonBackdrop from '@/components/layout/NeonBackdrop';

export default function Home() {
  const [hasContent, setHasContent] = useState(true);
  const [params] = useSearchParams();
  // Oyunlar görünümü kendi sekmesinde açılır; üst şerit yalnızca Sıcak/Takip görünümünde durur.
  const games = params.get('oyunlar') === '1';
  const showEmpty = !games && !hasContent;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#06060b] text-white">
      <NeonBackdrop />
      {/* Kaydırma alanı alt menünün üstünde biter: kartlar menünün altından geçmez. */}
      <div
        className="relative flex h-full flex-col"
        style={{ paddingBottom: `calc(${NAV_HEIGHT} - 10px + env(safe-area-inset-bottom, 0px))` }}
      >
        {!games && (
          <div className="shrink-0 pt-[env(safe-area-inset-top)]">
            <HomeTopBar />
          </div>
        )}
        <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-2 ${showEmpty ? 'pointer-events-none opacity-0' : ''}`}>
          <RoomDiscovery onContentChange={setHasContent} />
        </div>
      </div>
      {showEmpty && <EmptyRoomsArt />}
      <DesignBottomNav />
    </div>
  );
}