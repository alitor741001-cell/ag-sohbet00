import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import RoomDiscovery from '@/components/home/RoomDiscovery';
import EmptyRoomsArt from '@/components/home/EmptyRoomsArt';
import DesignBottomNav from '@/components/layout/DesignBottomNav';
import { Image } from '@/components/ui/image';
import HomeTopBar from '@/components/layout/HomeTopBar';
import { ART } from '@/lib/designArt';

// Oyunlar başlığı: görselin üst dilimi sabit kalır, oyunlar bu yazının altından kayar.
const GAMES_TITLE_HEIGHT = 'clamp(64px, 15vh, 112px)';

export default function Home() {
  const [hasContent, setHasContent] = useState(true);
  const [params] = useSearchParams();
  // Oyunlar görünümü kendi tema görselini kullanır ve üst şeridi göstermez.
  const games = params.get('oyunlar') === '1';
  const bg = games ? ART.gamesBg : ART.pageBg;
  const showEmpty = !games && !hasContent;

  return (
    <div className="home-screen fixed inset-0 overflow-hidden bg-catalog text-slot-text">
      <Image
        src={bg}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
      />
      {games && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 overflow-hidden"
          style={{ height: GAMES_TITLE_HEIGHT }}
          aria-hidden="true"
        >
          <Image
            src={bg}
            alt=""
            draggable={false}
            className="absolute left-0 top-0 w-full select-none object-cover"
            style={{ height: '100dvh' }}
          />
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-b from-transparent to-black" />
        </div>
      )}
      <div className="relative flex h-full flex-col">
        {!games && (
          <div className="home-top shrink-0 pt-[env(safe-area-inset-top)]">
            <HomeTopBar />
          </div>
        )}
        <div
          className={`home-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 ${showEmpty ? 'pointer-events-none opacity-0' : ''}`}
          style={games ? { paddingTop: GAMES_TITLE_HEIGHT } : undefined}
        >
          <RoomDiscovery onContentChange={setHasContent} />
        </div>
      </div>
      {showEmpty && <EmptyRoomsArt />}
      <DesignBottomNav />
    </div>
  );
}