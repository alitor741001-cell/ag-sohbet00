import { Link } from 'react-router-dom';
import NotificationBell from '@/components/friends/NotificationBell';
import { useWhiteCutout } from '@/lib/whiteCutout';
import FixedBanner from '@/components/layout/FixedBanner';
import useBannerBadges from '@/components/friends/BannerBadges';

const BANNER = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/4eb14dbda_IMG_0154.jpg';
const HOT = 'absolute inset-0 h-full w-full opacity-0';

const Dot = ({ count }) => count > 0 ? (
  <span className="pointer-events-none absolute -right-0.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-black/60">{count > 9 ? '9+' : count}</span>
) : null;

/** Mesajlar üst görseli: sağdaki üç yuvarlak tıklanabilir alanlardır; yeni öğede işaret çıkar. */
export default function MessagesBanner({ relations, userId, showBell = true }) {
  const src = useWhiteCutout(BANNER);
  const badges = useBannerBadges(userId, relations);
  return (
    <FixedBanner ratio="1024 / 342" maxWidth="max-w-md">
      {src && <img src={src} alt="Mesajlar" className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute" style={{ left: '58.5%', top: '25%', width: '13.5%', height: '50%' }}>
        <Link to="/arkadaslar/istekler" aria-label="İstekler" className={HOT} />
        <Dot count={badges.requests} />
      </div>
      {showBell && (
        <div className="absolute" style={{ left: '72.5%', top: '25%', width: '13.5%', height: '50%' }}>
          <NotificationBell buttonClassName={HOT} />
          <Dot count={badges.notes} />
        </div>
      )}
      <div className="absolute" style={{ left: '86.5%', top: '25%', width: '13%', height: '50%' }}>
        <Link to="/ajans/mesajlar" aria-label="Ajans mesajları" className={HOT} />
        <Dot count={badges.agency} />
      </div>
    </FixedBanner>
  );
}