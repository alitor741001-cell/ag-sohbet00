import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Building2 } from 'lucide-react';
import useBannerBadges from '@/components/friends/BannerBadges';

/** Sistem bildirimi ve ajans mesajları düğmeleri: ana sayfadaki görselin aynısını
    oda içindeki özel sohbet başlığında gösterir. */
const Badge = ({ count }) => count > 0 ? (
  <span className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-black/50">{count > 9 ? '9+' : count}</span>
) : null;

const BOX = 'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#F2CE6B]/40 bg-[#F2CE6B]/10 text-[#F2CE6B] active:scale-95';

export default function ChatHeaderActions({ userId, relations = [] }) {
  const badges = useBannerBadges(userId, relations);
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      <button
        type="button"
        onClick={() => navigate('/bildirimler', { state: { returnTo: location.pathname + location.search } })}
        aria-label="Sistem bildirimleri"
        className={BOX}
      >
        <Bell className="h-5 w-5" />
        <Badge count={badges.notes} />
      </button>
      <Link to="/ajans/mesajlar" aria-label="Ajans mesajları" className={BOX}>
        <Building2 className="h-5 w-5" />
        <Badge count={badges.agency} />
      </Link>
    </>
  );
}