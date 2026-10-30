import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Clapperboard } from 'lucide-react';
import RoomDiscovery from '@/components/home/RoomDiscovery';
import EmptyRoomsArt from '@/components/home/EmptyRoomsArt';
import DesignBottomNav, { NAV_HEIGHT } from '@/components/layout/DesignBottomNav';
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
    <div className="fixed inset-0 overflow-hidden bg-black text-white">
      <img
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
          <img
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
          <div className="shrink-0 -mt-2 pt-[env(safe-area-inset-top)]">
            <HomeTopBar />
          </div>
        )}
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-[calc(${NAV_HEIGHT}+0.75rem)] ${showEmpty ? 'pointer-events-none opacity-0' : ''}`}
          style={games ? { paddingTop: GAMES_TITLE_HEIGHT } : undefined}
        >
          <RoomDiscovery onContentChange={setHasContent} />
        </div>
      </div>
      {showEmpty && <EmptyRoomsArt />}
      {/* Menüde Film İzle girişi: alt menünün hemen üstünde, sağda durur. */}
      <Link
        to="/film-izle"
        aria-label="Film İzle"
        className="absolute right-3 z-30 flex items-center gap-1.5 rounded-full border border-[#ef4343]/60 bg-black/80 px-3.5 py-2 text-[12px] font-extrabold text-white shadow-[0_0_18px_rgba(239,67,67,0.45)] backdrop-blur active:scale-95"
        style={{ bottom: `calc(${NAV_HEIGHT} + 0.75rem)` }}
      >
        <Clapperboard className="h-4 w-4 text-[#ef4343]" />
        Film İzle
      </Link>
      <DesignBottomNav />
    </div>
  );
}