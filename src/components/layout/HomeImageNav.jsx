import LiveChatButton from '@/components/layout/LiveChatButton';
import UserSupportButton from '@/components/layout/UserSupportButton';

export const HOME_DESIGN = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/a5c5853e0_IMG_0141.jpg';

const ZONES = [
  { label: 'Ana Sayfa', path: '/', left: 0, width: 22 },
  { label: 'Sohbet', path: '/arkadaslar?view=chats', activePath: '/arkadaslar', left: 22, width: 17.5 },
  { label: 'Oyunlar', path: '/?oyunlar=1', left: 39.5, width: 21 },
  { label: 'Profil', path: '/profil', left: 79.5, width: 20.5 },
];

function isActive(z, pathname, search) {
  if (z.path === '/?oyunlar=1') return pathname === '/' && search.includes('oyunlar=1');
  if (z.path === '/') return pathname === '/' && !search.includes('oyunlar=1');
  return pathname.startsWith(z.activePath || z.path);
}

/** Tüm sayfalardaki alt menü: tasarım görselinin alt şeridi, üstünde dokunma alanları. */
export default function HomeImageNav({ onNav, isAdmin, supportBadge, messages = 0, pathname = '/', search = '', keyboardInset = 0 }) {
  return (
    <nav aria-label="Ana menü" className="lg:hidden fixed bottom-0 inset-x-0 z-50"
      style={{ background: 'transparent', paddingBottom: 'calc(env(safe-area-inset-bottom) * 0.4)', transform: `translateY(-${keyboardInset}px)` }}>
      <div className="relative mx-auto w-full max-w-[36rem]" style={{ aspectRatio: '682 / 200', backgroundImage: `url(${HOME_DESIGN})`, backgroundSize: '100% auto', backgroundPosition: 'center bottom' }}>
        {ZONES.map((z) => {
          const active = isActive(z, pathname, search);
          return (
            <button key={z.label} type="button" aria-label={z.label} aria-current={active ? 'page' : undefined} onClick={() => onNav(z)}
              className="absolute top-[10%] bottom-0 transition-transform active:scale-95" style={{ left: `${z.left}%`, width: `${z.width}%` }}>
              {active && <span aria-hidden="true" className="absolute bottom-[6%] left-1/2 h-[3px] w-1/2 -translate-x-1/2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]" />}
              {z.activePath === '/arkadaslar' && messages > 0 && (
                <span className="absolute right-[18%] top-[8%] min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{messages > 99 ? '99+' : messages}</span>
              )}
            </button>
          );
        })}
        <div className="absolute top-[10%] bottom-0 flex items-center justify-center opacity-0 [&>*]:h-full [&>*]:w-full" style={{ left: '60.5%', width: '19%' }}>
          {isAdmin ? <LiveChatButton placement="dock" /> : <UserSupportButton badge={supportBadge} />}
        </div>
      </div>
    </nav>
  );
}