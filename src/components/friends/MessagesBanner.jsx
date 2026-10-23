import { Link } from 'react-router-dom';
import NotificationBell from '@/components/friends/NotificationBell';

const BANNER = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/86dc7f4f1_IMG_0147.jpg';
const HOT = 'absolute inset-0 h-full w-full opacity-0';

/** Mesajlar üst görseli: sağdaki üç yuvarlak tıklanabilir alanlardır.
    Kenarlardaki arka plan sayfa zeminine yumuşakça geçer, metin net kalır. */
export default function MessagesBanner({ relations, userId, invoke, showBell = true }) {
  return (
    <div className="sticky top-0 z-30 w-full">
      <div className="relative w-full" style={{ aspectRatio: '1024 / 342' }}>
        <img src={BANNER} alt="Mesajlar" className="absolute inset-0 h-full w-full object-cover" />
        {/* Sol kenar geçişi */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-[8%]" style={{ background: 'linear-gradient(90deg, rgba(7,6,11,1) 0%, rgba(7,6,11,0) 100%)' }} />
        {/* Sağ kenar geçişi */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-[8%]" style={{ background: 'linear-gradient(270deg, rgba(7,6,11,1) 0%, rgba(7,6,11,0) 100%)' }} />
        {/* Alt kenar geçişi (ince, metne dokunmaz) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[10%]" style={{ background: 'linear-gradient(180deg, rgba(7,6,11,0) 0%, rgba(7,6,11,1) 100%)' }} />
        <div className="absolute" style={{ left: '58.5%', top: '25%', width: '13.5%', height: '50%' }}>
          <Link to="/arkadaslar/istekler" aria-label="İstekler" className={HOT} />
        </div>
        {showBell && (
          <div className="absolute" style={{ left: '72.5%', top: '25%', width: '13.5%', height: '50%' }}>
            <NotificationBell buttonClassName={HOT} />
          </div>
        )}
        <Link to="/ajans/mesajlar" aria-label="Ajans mesajları" className="absolute" style={{ left: '86.5%', top: '25%', width: '13%', height: '50%' }} />
      </div>
    </div>
  );
}