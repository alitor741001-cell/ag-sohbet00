import { Link, useLocation } from 'react-router-dom';
import { useCurrentUser } from '@/lib/useCurrentUser';
import useSupportBadge from '@/hooks/useSupportBadge';
import { useMessageRealtime } from '@/components/messages/MessageRealtimeProvider';
import useCutoutSprites from '@/hooks/useCutoutSprites';

// Düğme sırası: Ana Sayfa, Sohbet, Oyunlar, Canlı Destek, Profil (tasarım görseliyle birebir).
const ZONES = [
  { label: 'Ana Sayfa', to: '/', match: (p, s) => p === '/' && !s.includes('oyunlar=1') },
  { label: 'Sohbet', to: '/arkadaslar?view=chats', match: (p) => p.startsWith('/arkadaslar'), badge: 'chat' },
  { label: 'Oyunlar', to: '/?oyunlar=1', match: (p, s) => p === '/' && s.includes('oyunlar=1') },
  { label: 'Canlı Destek', to: '/destek', match: (p) => p === '/destek', badge: 'support' },
  { label: 'Profil', to: '/profil', match: (p) => p === '/profil' },
];

const SPRITE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/81225dedf_IMG_0522.jpg';

export const NAV_HEIGHT = 'clamp(74px, 21vw, 100px)';

/** Ana menü: şeffaf PNG düğmeler — altında beyaz zemin yok. */
export default function DesignBottomNav() {
  const { pathname, search } = useLocation();
  const { user } = useCurrentUser();
  const support = useSupportBadge(user?.id);
  const { badges } = useMessageRealtime();
  const counts = { chat: badges?.messages || 0, support: support || 0 };
  const sprites = useCutoutSprites(SPRITE, ZONES.length);

  return (
    <nav
      id="app-bottom-nav"
      aria-label="Ana menü"
      className="fixed inset-x-0 bottom-0 z-[60]"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)' }}
    >
      <div className="flex w-full items-end justify-between gap-0.5 px-1.5">
        {ZONES.map((zone, index) => {
          const active = zone.match(pathname, search);
          const count = zone.badge ? counts[zone.badge] : 0;
          const sprite = sprites[index];
          return (
            <Link
              key={zone.label}
              to={zone.to}
              aria-label={zone.label}
              aria-current={active ? 'page' : undefined}
              className="relative flex flex-1 items-end justify-center transition-transform active:scale-95"
            >
              {sprite ? (
                <img
                  src={sprite.src}
                  alt=""
                  draggable={false}
                  className="pointer-events-none select-none"
                  style={{
                    height: 'clamp(42px, 13vw, 58px)',
                    width: 'auto',
                    filter: active ? 'brightness(1.25) drop-shadow(0 0 10px rgba(255,255,255,0.35))' : 'none',
                  }}
                />
              ) : (
                <span aria-hidden="true" style={{ height: 'clamp(42px, 13vw, 58px)' }} />
              )}
              {count > 0 && (
                <span className="absolute right-[16%] top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ef4343] px-1 text-[11px] font-bold leading-none text-white ring-2 ring-black/70">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}