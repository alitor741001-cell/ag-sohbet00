import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, Headphones, Home, MessagesSquare, User } from 'lucide-react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import useSupportBadge from '@/hooks/useSupportBadge';
import { useMessageRealtime } from '@/components/messages/MessageRealtimeProvider';

// Düğme sırası: Ana Sayfa, Sohbet, Oyunlar, Canlı Destek, Profil.
const ZONES = [
  { label: 'Ana Sayfa', to: '/', Icon: Home, match: (p, s) => p === '/' && !s.includes('oyunlar=1') },
  { label: 'Sohbet', to: '/arkadaslar?view=chats', Icon: MessagesSquare, match: (p) => p.startsWith('/arkadaslar'), badge: 'chat' },
  { label: 'Oyunlar', to: '/?oyunlar=1', Icon: Gamepad2, match: (p, s) => p === '/' && s.includes('oyunlar=1') },
  { label: 'Destek', to: '/destek', Icon: Headphones, match: (p) => p === '/destek', badge: 'support' },
  { label: 'Profil', to: '/profil', Icon: User, match: (p) => p === '/profil' },
];

export const NAV_HEIGHT = 'calc(66px + env(safe-area-inset-bottom, 0px))';

/**
 * Ana menü: görsel dilim yok, hafif simge + etiket. Aktif sekme kırmızı ışıkla
 * işaretlenir; çubuk ekranın en dibine, çentik hizasına kadar iner.
 */
export default function DesignBottomNav() {
  const { pathname, search } = useLocation();
  const { user } = useCurrentUser();
  const support = useSupportBadge(user?.id);
  const { badges } = useMessageRealtime();
  const counts = { chat: badges?.messages || 0, support: support || 0 };

  return (
    <nav
      id="app-bottom-nav"
      aria-label="Ana menü"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-[#0b0b0f]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        boxShadow: '0 -12px 28px -18px rgba(0,0,0,0.95)',
      }}
    >
      <div className="mx-auto flex h-[66px] w-full max-w-[36rem] items-stretch">
        {ZONES.map((zone) => {
          const active = zone.match(pathname, search);
          const count = zone.badge ? counts[zone.badge] : 0;
          const Icon = zone.Icon;
          return (
            <Link
              key={zone.label}
              to={zone.to}
              aria-label={zone.label}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors active:bg-white/5 ${active ? 'text-primary' : 'text-white/55'}`}
            >
              <span
                aria-hidden="true"
                className={`absolute top-0 h-[2px] w-8 rounded-full transition-opacity ${active ? 'bg-primary opacity-100' : 'opacity-0'}`}
              />
              <span className="relative">
                <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.4 : 1.9} />
                {count > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground ring-2 ring-[#0b0b0f]">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </span>
              <span className={`text-[9.5px] leading-none ${active ? 'font-black' : 'font-semibold'}`}>{zone.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}