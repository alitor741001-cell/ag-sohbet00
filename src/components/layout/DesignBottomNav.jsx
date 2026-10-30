import { Link, useLocation } from 'react-router-dom';
import { useTrimmedArt } from '@/hooks/useKeyedImage';
import { ART } from '@/lib/designArt';
import { useCurrentUser } from '@/lib/useCurrentUser';
import useSupportBadge from '@/hooks/useSupportBadge';
import { useMessageRealtime } from '@/components/messages/MessageRealtimeProvider';

// Düğme sırası: Ana Sayfa, Sohbet, Oyunlar, Canlı Destek.
const ZONES = [
  { label: 'Ana Sayfa', to: '/', match: (p, s) => p === '/' && !s.includes('oyunlar=1') },
  { label: 'Sohbet', to: '/arkadaslar?view=chats', match: (p) => p.startsWith('/arkadaslar'), badge: 'chat' },
  { label: 'Oyunlar', to: '/?oyunlar=1', match: (p, s) => p === '/' && s.includes('oyunlar=1') },
  { label: 'Canlı Destek', to: '/destek', match: (p) => p === '/destek', badge: 'support' },
];

export const NAV_HEIGHT = 'clamp(92px, 33vw, 154px)';

/** Ana menü: tasarım görseli çentik hizasına kadar iner, düğmeler görselin üstünde tıklanır. */
export default function DesignBottomNav() {
  const { pathname, search } = useLocation();
  const { user } = useCurrentUser();
  const support = useSupportBadge(user?.id);
  const { badges } = useMessageRealtime();
  const counts = { chat: badges?.messages || 0, support: support || 0 };
  // Kenar boşlukları kırpılır: tasarımın alt kenarı çentik hizasına oturur.
  const art = useTrimmedArt(ART.bottomNav, { top: 0, height: 1, trim: true });

  return (
    <nav aria-label="Ana menü" className="pointer-events-none fixed inset-x-0 bottom-0 z-[60]" style={{ transform: 'translateY(calc(env(safe-area-inset-bottom, 0px) - 10px))' }}>
      <div
        className="relative w-full"
        style={art ? { aspectRatio: String(art.ratio) } : { height: NAV_HEIGHT }}
      >
        {art && <img src={art.url} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none" />}
        <div className="pointer-events-auto absolute inset-x-[3%] bottom-0 top-[16%] flex items-stretch">
          {ZONES.map((zone) => {
            const active = zone.match(pathname, search);
            const count = zone.badge ? counts[zone.badge] : 0;
            return (
              <Link
                key={zone.label}
                to={zone.to}
                aria-label={zone.label}
                aria-current={active ? 'page' : undefined}
                className="relative flex flex-1 items-start justify-center rounded-xl active:scale-95"
              >
                {count > 0 && (
                  <span className="absolute right-[20%] top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ef4343] px-1 text-[11px] font-bold leading-none text-white ring-2 ring-black/70">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}