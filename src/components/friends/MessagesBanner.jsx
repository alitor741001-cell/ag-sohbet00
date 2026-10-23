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
        {/* Koyu zemin "screen" karışımıyla kaybolur, yalnızca parlak yazı ve ikonlar kalır. */}
        <img src={BANNER} alt="Mesajlar" className="absolute inset-0 h-full w-full object-cover" style={{ mixBlendMode: 'screen' }} />
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