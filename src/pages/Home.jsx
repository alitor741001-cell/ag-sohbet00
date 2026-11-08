import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import RoomDiscovery from '@/components/home/RoomDiscovery';
import EmptyRoomsArt from '@/components/home/EmptyRoomsArt';
import DesignBottomNav, { NAV_HEIGHT } from '@/components/layout/DesignBottomNav';
import HomeTopBar from '@/components/layout/HomeTopBar';

export default function Home() {
  const [hasContent, setHasContent] = useState(true);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  // Oyunlar görünümü alt menüden ?oyunlar=1 ile açılır.
  const games = params.get('oyunlar') === '1';
  const view = params.get('takip') === '1' ? 'history' : 'hot';
  const showEmpty = !games && !hasContent;

  return (
    <div className="fixed inset-0 overflow-hidden bg-background text-white">
      {/* Kaydırma alanı butonların üstünde biter: kartlar alt menünün altından geçmez. */}
      <div className="relative flex h-full flex-col" style={{ paddingBottom: NAV_HEIGHT }}>
        {!games && (
          <div className="shrink-0 pt-[env(safe-area-inset-top)]">
            <HomeTopBar
              view={view}
              onView={(next) => navigate(next === 'history' ? '/?takip=1' : '/', { replace: true })}
              onSearch={() => navigate('/arama')}
            />
          </div>
        )}
        {games && (
          <div className="shrink-0 px-3 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
            <h1 className="text-base font-black tracking-tight">Oyunlar</h1>
            <p className="text-[11px] font-semibold text-white/45">Şansını dene, coin kazan</p>
          </div>
        )}
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-2 ${showEmpty ? 'pointer-events-none opacity-0' : ''}`}
        >
          <RoomDiscovery onContentChange={setHasContent} />
        </div>
      </div>
      {showEmpty && <EmptyRoomsArt />}
      <DesignBottomNav />
    </div>
  );
}