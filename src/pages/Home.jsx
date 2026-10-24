import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import RoomDiscovery from '@/components/home/RoomDiscovery';
import GamePanel from '@/components/games/GamePanel';

import BottomNavStrip from '@/components/layout/BottomNavStrip';
import NotchThemeStrip from '@/components/layout/NotchThemeStrip';
const LIVE_BG = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/f3cf6419a_IMG_0213.jpg';
const GAMES_DESIGN = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/cce749e92_IMG_0220.jpg';
const DESIGN = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/f729cdeba_IMG_0210.jpg';

// Dokunma alanları tasarım görseli üzerinde yüzde koordinatlarıyla yerleşir (540x1024 tabanlı).
const ZONES = [
  { label: 'Ana Sayfa', to: '/', x: 2, y: 1, w: 19, h: 10 },
  { label: 'Sıcak', to: '/', x: 23.5, y: 3.5, w: 19.5, h: 5 },
  { label: 'Takip', to: '/?takip=1', x: 45, y: 3.5, w: 19.5, h: 5 },
  { label: 'Ara', to: '/arama', x: 66, y: 3.5, w: 9, h: 5 },
  { label: 'Oda Kur', to: '/oda-kur', x: 77, y: 2.5, w: 21.5, h: 7.5 },
  { label: 'Ana Sayfa', to: '/', x: 3.5, y: 87, w: 17.5, h: 9.5 },
  { label: 'Sohbet', to: '/arkadaslar?view=chats', x: 23, y: 87, w: 17.5, h: 9.5 },
  { label: 'Oyunlar', to: '/?oyunlar=1', x: 41.5, y: 87, w: 17.5, h: 9.5 },
  { label: 'Canlı Destek', to: '/destek', x: 60, y: 87, w: 18.5, h: 9.5 },
  { label: 'Profil', to: '/profil', x: 79.5, y: 87, w: 17, h: 9.5 },
];

const EMPTY_ZONE = { label: 'İlk odayı sen aç', to: '/oda-kur', x: 22, y: 35.5, w: 57, h: 7 };

export default function Home() {
  const [hasContent, setHasContent] = useState(true);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  // Oyunlar görünümü aynı ana sayfa temasını kullanır; üst sekme alanları burada yoktur.
  const games = params.get('oyunlar') === '1';
  // Oyunlar görünümü kendi tasarım görselini kullanır.
  const design = games ? GAMES_DESIGN : DESIGN;
  // Oyunlar görünümünde yalnızca alt menü düğmeleri tıklanabilir kalır.
  const base = games ? ZONES.filter((z) => z.y >= 80) : ZONES;
  const zones = hasContent || games ? base : [...base, EMPTY_ZONE];

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white">
      {!games && <NotchThemeStrip />}
      {/* Güvenli alanın dışında kalan pikseller aynı tasarımın bulanık dolgusuyla kapanır. */}
      <img src={design} alt="" aria-hidden="true" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full scale-110 select-none object-fill opacity-60 blur-2xl" />
      {/* Tasarım çentik ve güvenli alanın içinde kalır; tablette ortada telefon oranında durur. */}
      <div className="design-screen">
        <div className="design-stage">
          {/* Ana tema görseli oyunlar görünümünde de arkada durur. */}
          <img src={design} alt="" className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill" draggable={false} />
          {!games && hasContent && (
            <img src={LIVE_BG} alt="" className="pointer-events-none absolute inset-x-[3%] select-none rounded-2xl object-cover" style={{ top: '12%', bottom: '14%', height: '74%', width: '94%' }} draggable={false} />
          )}
          {/* Alt menü şeridi her görünümde içeriğin üstünde durur; içerik şeridin altından akar. */}
          <div className="pointer-events-none absolute inset-0 z-30">
            <BottomNavStrip />
          </div>
          {zones.map((z) => (
            <Link
              key={z.label + z.y}
              to={z.to}
              aria-label={z.label}
              className="absolute z-20 rounded-2xl active:bg-white/10"
              style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%` }}
            />
          ))}
          {games ? (
            /* Oyunlar sesli sohbetlerdeki oyun merkeziyle aynı tam ekran panelde açılır. */
            <GamePanel open fullList onClose={() => navigate('/')} />
          ) : (
            <div
              className={`absolute inset-x-[3%] z-10 overflow-y-auto overscroll-contain rounded-2xl px-2 py-2 ${hasContent ? '' : 'pointer-events-none opacity-0'}`}
              style={{ top: '12%', bottom: '14%', background: 'transparent' }}
              key={params.toString()}
            >
              <RoomDiscovery onContentChange={setHasContent} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}