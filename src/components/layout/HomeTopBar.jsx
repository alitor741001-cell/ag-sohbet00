import { Link } from 'react-router-dom';
import useCutoutRegions from '@/hooks/useCutoutRegions';
import { Image } from '@/components/ui/image';
const ART = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/0664b7ff1_IMG_0536.jpg';
const REGIONS = [{ x: 0, y: 0, w: 1, h: 1 }];

// Görseldeki sıra: AG kalkanı, Sıcak, Takip, Ara, Oda Kur.
const ZONES = [
  { label: 'Sıcak', to: '/', x: 0, w: 30.5 },
  { label: 'Takip', to: '/?takip=1', x: 30.5, w: 27.7 },
  { label: 'Ara', to: '/arama', x: 58.2, w: 13.5 },
  { label: 'Oda Kur', to: '/oda-kur', x: 71.7, w: 28.3 },
];

/** Ana sayfanın üst şeridi: tasarım görseli + görseldeki düğmelerin dokunma alanları. */
export default function HomeTopBar() {
  const [src] = useCutoutRegions(ART, REGIONS);
  return (
    <div className="relative w-full" style={{ aspectRatio: '1008 / 172' }}>
      <div className="absolute inset-0">
        {src && <Image src={src} alt="" fittingType="fit" className="pointer-events-none absolute inset-0 h-full w-full" />}
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
    </div>
  );
}