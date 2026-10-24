import { Home, MessageCircle, Gamepad2, User } from 'lucide-react';
import LiveChatButton from '@/components/layout/LiveChatButton';
import UserSupportButton from '@/components/layout/UserSupportButton';

export const HOME_DESIGN = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/a5c5853e0_IMG_0141.jpg';

const ZONES = [
  { label: 'Ana Sayfa', path: '/', icon: Home },
  { label: 'Sohbet', path: '/arkadaslar?view=chats', activePath: '/arkadaslar', icon: MessageCircle },
  { label: 'Oyunlar', path: '/?oyunlar=1', icon: Gamepad2 },
  { label: 'Profil', path: '/profil', icon: User },
];

function isActive(z, pathname, search) {
  if (z.path === '/?oyunlar=1') return pathname === '/' && search.includes('oyunlar=1');
  if (z.path === '/') return pathname === '/' && !search.includes('oyunlar=1');
  return pathname.startsWith(z.activePath || z.path);
}

/** Tüm sayfalardaki alt menü: ikon ve etiket görünür, dokunma alanı net. */
export default function HomeImageNav({ onNav, isAdmin, supportBadge, messages = 0, pathname = '/', search = '', keyboardInset = 0 }) {
  const renderZone = (z) => {
    const active = isActive(z, pathname, search);
    const Icon = z.icon;
    return (
      <button key={z.label} type="button" aria-label={z.label} aria-current={active ? 'page' : undefined} onClick={() => onNav(z)}
        className="relative flex flex-1 flex-col items-center justify-center gap-1 pb-[env(safe-area-inset-bottom)] pt-2 transition-transform active:scale-95">
        <Icon aria-hidden="true" strokeWidth={1.8} className="h-[22px] w-[22px]" style={{ color: active ? '#ffb02e' : '#9aa7b8' }} />
        <span className="text-[9.5px] font-semibold leading-none" style={{ color: active ? '#ffc23a' : '#9aa7b8' }}>{z.label}</span>
        {active && <span aria-hidden="true" className="absolute bottom-[calc(env(safe-area-inset-bottom)+2px)] left-1/2 h-[3px] w-1/2 -translate-x-1/2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]" />}
        {z.activePath === '/arkadaslar' && messages > 0 && (
          <span className="absolute right-[18%] top-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{messages > 99 ? '99+' : messages}</span>
        )}
      </button>
    );
  };

  return (
    <nav aria-label="Ana menü" className="home-image-nav lg:hidden fixed bottom-0 inset-x-0 z-50"
      style={{ background: '#0a0a0d', paddingBottom: 0, transform: `translateY(-${keyboardInset}px)` }}>
      <div className="relative mx-auto flex w-full max-w-[36rem] items-stretch justify-between" style={{ minHeight: '4rem' }}>
        {ZONES.slice(0, 3).map(renderZone)}
        <div className="flex flex-1 items-center justify-center pb-[env(safe-area-inset-bottom)] pt-2">
          {isAdmin ? <LiveChatButton placement="dock" /> : <UserSupportButton badge={supportBadge} />}
        </div>
        {ZONES.slice(3).map(renderZone)}
      </div>
    </nav>
  );
}