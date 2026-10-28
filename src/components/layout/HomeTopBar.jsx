import { Link } from 'react-router-dom';
import DesignArt from '@/components/layout/DesignArt';
import { ART } from '@/lib/designArt';

// Görseldeki sıra: AG kalkanı, Sıcak, Takip, Ara, Oda Kur.
const ZONES = [
  { label: 'Ana Sayfa', to: '/', x: 0.5, w: 13.5 },
  { label: 'Sıcak', to: '/', x: 15, w: 20 },
  { label: 'Takip', to: '/?takip=1', x: 36, w: 19 },
  { label: 'Ara', to: '/arama', x: 56, w: 11 },
  { label: 'Oda Kur', to: '/oda-kur', x: 68, w: 31 },
];

/** Ana sayfanın üst şeridi: tasarım görseli + görseldeki düğmelerin dokunma alanları. */
export default function HomeTopBar() {
  return (
    <div className="relative w-full" style={{ height: 'clamp(72px, 30vw, 140px)' }}>
      <DesignArt src={ART.topBar} className="absolute inset-0 h-full w-full object-contain" />
      {ZONES.map((zone) => (
        <Link
          key={zone.label}
          to={zone.to}
          aria-label={zone.label}
          className="absolute rounded-full active:scale-95"
          style={{ left: `${zone.x}%`, width: `${zone.w}%`, top: '6%', height: '88%' }}
        />
      ))}
    </div>
  );
}