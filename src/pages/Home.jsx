import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import RoomDiscovery from '@/components/home/RoomDiscovery';
import EmptyRoomsArt from '@/components/home/EmptyRoomsArt';
import DesignBottomNav, { NAV_HEIGHT } from '@/components/layout/DesignBottomNav';
import HomeTopBar from '@/components/layout/HomeTopBar';
import { ART } from '@/lib/designArt';

export default function Home() {
  const [hasContent, setHasContent] = useState(true);
  const [params] = useSearchParams();
  // Oyunlar görünümü kendi tema görselini kullanır ve üst şeridi göstermez.
  const games = params.get('oyunlar') === '1';
  const bg = games ? ART.gamesBg : ART.pageBg;
  const showEmpty = !games && !hasContent;

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white">
      <img
        src={bg}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
      />
      <div className="relative flex h-full flex-col">
        {!games && (
          <div className="shrink-0 pt-[env(safe-area-inset-top)]">
            <HomeTopBar />
          </div>
        )}
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-[calc(${NAV_HEIGHT}+0.75rem)] ${games ? 'pt-[env(safe-area-inset-top)]' : ''} ${showEmpty ? 'pointer-events-none opacity-0' : ''}`}
        >
          <RoomDiscovery onContentChange={setHasContent} />
        </div>
      </div>
      {showEmpty && <EmptyRoomsArt />}
      <DesignBottomNav />
    </div>
  );
}