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

export const NAV_HEIGHT = 'clamp(66px, 19vw, 90px)';
// Düğme yüksekliği: ana sayfanın alt menüsü biraz daha kompakt durur.
const BUTTON_HEIGHT = 'clamp(44px, 13.5vw, 60px)';

/** Ana menü: şeffaf PNG düğmeler — altında beyaz zemin yok. */
export default function DesignBottomNav() {
  const { pathname, search } = useLocation();
  const { user } = useCurrentUser();
  const support = useSupportBadge(user?.id);
  const { badges } = useMessageRealtime();
  const counts = { chat: badges?.messages || 0, support: support || 0 };
  // Kırpma açık: düğme görselleri hücrelerinin boş kenarlarından arındırılır ve
  // ekranda olabildiğince büyük görünür.
  const sprites = useCutoutSprites(SPRITE, ZONES.length, true);

  return (
    <nav
      id="app-bottom-nav"
      aria-label="Ana menü"
      className="fixed inset-x-0 bottom-0 z-[60]"
      /* Düğmeler güvenli alanın içinde durur: çentik, çene çubuğu ve sistem
          hareket çubuğunun altında kalmaz, tüm telefonlarda tam görünür. */
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <div className="flex w-full items-end justify-between gap-0.5 px-0.5">
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
                  className="pointer-events-none select-none object-contain"
                  style={{
                    height: BUTTON_HEIGHT,
                    width: '100%',
                    filter: active ? 'brightness(1.25) drop-shadow(0 0 10px rgba(255,255,255,0.35))' : 'none',
                  }}
                />
              ) : (
                <span aria-hidden="true" style={{ height: BUTTON_HEIGHT, width: '100%' }} />
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