import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Gamepad2, Headphones, User } from 'lucide-react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import useSupportBadge from '@/hooks/useSupportBadge';
import { useMessageRealtime } from '@/components/messages/MessageRealtimeProvider';

// Düğme sırası: Ana Sayfa, Sohbet, Oyunlar, Canlı Destek, Profil.
const ZONES = [
  { label: 'Ana Sayfa', short: 'Ana Sayfa', Icon: Home, to: '/', match: (p, s) => p === '/' && !s.includes('oyunlar=1') },
  { label: 'Sohbet', short: 'Sohbet', Icon: MessageCircle, to: '/arkadaslar?view=chats', match: (p) => p.startsWith('/arkadaslar'), badge: 'chat' },
  { label: 'Oyunlar', short: 'Oyunlar', Icon: Gamepad2, to: '/?oyunlar=1', match: (p, s) => p === '/' && s.includes('oyunlar=1') },
  { label: 'Canlı Destek', short: 'Destek', Icon: Headphones, to: '/destek', match: (p) => p === '/destek', badge: 'support' },
  { label: 'Profil', short: 'Profil', Icon: User, to: '/profil', match: (p) => p === '/profil' },
];

// Çubuğun yüksekliği sabittir: sayfalar (ana sayfa, profil) içeriklerini bu ölçüye göre
// bitirir, alt menü hiçbir düğmenin üstüne binmez.
const BAR_HEIGHT = 'clamp(56px, 15vw, 68px)';
export const NAV_HEIGHT = `calc(${BAR_HEIGHT} + 14px)`;

/**
 * Ana menü: koyu cam bar üzerinde ikonlu düğmeler.
 * Seçili düğme kırmızı neon bir kapsülle yanar. Görsel işleme yoktur: açılışta
 * hiçbir görsel kesilmez, menü ilk boyamada hazır durur.
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
      className="fixed inset-x-0 bottom-0 z-[60]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div
        className="relative flex items-stretch gap-0.5 rounded-[22px] border border-white/10 bg-[#0b0b12]/92 px-1 pt-1 shadow-[0_-10px_30px_-18px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-xl"
        style={{
          height: BAR_HEIGHT,
          marginLeft: 'max(8px, env(safe-area-inset-left, 0px))',
          marginRight: 'max(8px, env(safe-area-inset-right, 0px))',
        }}
      >
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
              className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-[2px] rounded-[17px] pb-1 transition-transform active:scale-95"
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[17px] border border-primary/45 bg-primary/15 shadow-[0_0_20px_-2px_rgba(239,68,68,0.75),inset_0_1px_0_rgba(255,255,255,0.12)]"
                />
              )}
              <Icon
                aria-hidden="true"
                className={active
                  ? 'relative h-[19px] w-[19px] shrink-0 text-white drop-shadow-[0_0_7px_rgba(239,68,68,0.9)]'
                  : 'relative h-[19px] w-[19px] shrink-0 text-white/55'}
                strokeWidth={active ? 2.6 : 2.1}
              />
              <span
                className={active
                  ? 'relative max-w-full truncate px-0.5 text-[8px] font-bold uppercase tracking-[0.04em] text-white'
                  : 'relative max-w-full truncate px-0.5 text-[8px] font-semibold uppercase tracking-[0.04em] text-white/50'}
              >
                {zone.short}
              </span>
              {count > 0 && (
                <span className="absolute right-[18%] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4343] px-1 text-[9px] font-bold leading-none text-white ring-2 ring-[#0b0b12]">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          );
        })}
        {/* Çubuğun üstündeki ince ışık çizgisi: cam yüzey hissi. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      </div>
    </nav>
  );
}