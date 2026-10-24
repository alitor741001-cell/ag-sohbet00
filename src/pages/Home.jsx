import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import RoomDiscovery from '@/components/home/RoomDiscovery';

import BottomNavStrip from '@/components/layout/BottomNavStrip';
import NotchThemeStrip from '@/components/layout/NotchThemeStrip';
const LIVE_BG = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/f3cf6419a_IMG_0213.jpg';
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
  // Oyunlar görünümü aynı ana sayfa temasını kullanır; üst sekme alanları burada yoktur.
  const games = params.get('oyunlar') === '1';
  // Oyunlar görünümü tam ekran oynanır: alt menü butonları ve dokunma alanları gizlenir.
  const base = games ? [] : ZONES;
  const zones = hasContent || games ? base : [...base, EMPTY_ZONE];

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white">
      {!games && <NotchThemeStrip />}
      {/* Güvenli alanın dışında kalan pikseller aynı tasarımın bulanık dolgusuyla kapanır. */}
      {!games && (
        <img src={DESIGN} alt="" aria-hidden="true" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full scale-110 select-none object-fill opacity-60 blur-2xl" />
      )}
      {/* Tasarım çentik ve güvenli alanın içinde kalır; tablette ortada telefon oranında durur. */}
      <div className="design-screen">
        <div className="design-stage">
          {/* Oyunlar görünümünde hiçbir tema görseli gösterilmez. */}
          {!games && (
            <img src={DESIGN} alt="" className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill" draggable={false} />
          )}
          {!games && hasContent && (
            <img src={LIVE_BG} alt="" className="pointer-events-none absolute inset-x-[3%] select-none rounded-2xl object-cover" style={{ top: '12%', bottom: '14%', height: '74%', width: '94%' }} draggable={false} />
          )}
          {!games && <BottomNavStrip />}
          {games && (
            <Link
              to="/"
              aria-label="Ana sayfaya dön"
              className="absolute left-3 top-2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-white ring-1 ring-white/20 active:bg-white/15"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}
          {zones.map((z) => (
            <Link
              key={z.label + z.y}
              to={z.to}
              aria-label={z.label}
              className="absolute z-20 rounded-2xl active:bg-white/10"
              style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%` }}
            />
          ))}
          <div
            className={`absolute inset-x-[3%] z-10 overflow-y-auto overscroll-contain rounded-2xl px-2 py-2 ${hasContent ? '' : 'pointer-events-none opacity-0'}`}
            style={games ? { top: '3.6rem', bottom: 0, left: 0, right: 0, paddingBottom: 'var(--safe-bottom)', background: 'transparent' } : { top: '12%', bottom: '14%', background: 'transparent' }}
            key={params.toString()}
          >
            <RoomDiscovery onContentChange={setHasContent} />
          </div>
        </div>
      </div>
    </div>
  );
}