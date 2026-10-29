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

function NavButton({ z, active, messages, onNav }) {
  const Icon = z.icon;
  return (
    <button type="button" aria-label={z.label} aria-current={active ? 'page' : undefined} onClick={() => onNav(z)}
      className="relative flex flex-1 flex-col items-center justify-center gap-1 pb-2 pt-2 transition-transform active:scale-95">
      <Icon aria-hidden="true" strokeWidth={2} className="h-6 w-6" style={{ color: active ? '#ffb02e' : '#e5e7eb' }} />
      <span className="text-[11px] font-bold leading-none" style={{ color: active ? '#ffc23a' : '#ffffff' }}>{z.label}</span>
      {z.activePath === '/arkadaslar' && messages > 0 && (
        <span className="absolute right-[18%] top-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{messages > 99 ? '99+' : messages}</span>
      )}
    </button>
  );
}

/** Tüm sayfalardaki alt menü: düz zemin, net ikon ve etiketler. */
export default function HomeImageNav({ onNav, isAdmin, supportBadge, messages = 0, pathname = '/', search = '', keyboardInset = 0 }) {
  const btn = (z) => <NavButton key={z.label} z={z} active={isActive(z, pathname, search)} messages={messages} onNav={onNav} />;
  return (
    <nav aria-label="Ana menü" className="home-image-nav lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0a0a0d]"
      style={{ transform: `translateY(-${keyboardInset}px)` }}>
      <div className="mx-auto flex w-full items-stretch" style={{ minHeight: '4rem' }}>
        {ZONES.slice(0, 3).map(btn)}
        <div className="flex flex-1 items-center justify-center pb-2 pt-2">
          {isAdmin ? <LiveChatButton placement="dock" /> : <UserSupportButton badge={supportBadge} />}
        </div>
        {ZONES.slice(3).map(btn)}
      </div>
    </nav>
  );
}