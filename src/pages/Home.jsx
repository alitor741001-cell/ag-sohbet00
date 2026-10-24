import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import RoomDiscovery from '@/components/home/RoomDiscovery';

import SupportLabel from '@/components/layout/SupportLabel';
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
  const zones = hasContent ? ZONES : [...ZONES, EMPTY_ZONE];

  return (
    <div className="fixed inset-0 overflow-hidden text-white" style={{ background: '#0a0a0d' }}>
      <img src={DESIGN} alt="" className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill" draggable={false} />
      <SupportLabel top="92.5%" height="3.5%" />
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
        className={`absolute inset-x-[3%] z-10 overflow-y-auto rounded-2xl px-2 py-2 ${hasContent ? '' : 'pointer-events-none opacity-0'}`}
        style={{ top: '12%', bottom: '14%', background: hasContent ? '#0a0a0d' : 'transparent' }}
        key={params.toString()}
      >
        <RoomDiscovery onContentChange={setHasContent} />
      </div>
    </div>
  );
}