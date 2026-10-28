import { Link } from 'react-router-dom';
import DesignArt from '@/components/layout/DesignArt';
import { ART } from '@/lib/designArt';

/** Sıcaklar sekmesinde açık yayın yokken gösterilen boş durum tasarımı. */
export default function EmptyRoomsArt() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <div className="relative" style={{ aspectRatio: '853 / 1844', height: 'min(60vh, 150vw)' }}>
        <DesignArt src={ART.emptyRooms} className="absolute inset-0 h-full w-full object-contain" />
        <Link
          to="/oda-kur"
          aria-label="İlk odayı sen aç"
          className="pointer-events-auto absolute rounded-full active:scale-95"
          style={{ left: '14%', width: '72%', top: '77%', height: '7%' }}
        />
      </div>
    </div>
  );
}