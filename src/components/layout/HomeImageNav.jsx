import LiveChatButton from '@/components/layout/LiveChatButton';
import UserSupportButton from '@/components/layout/UserSupportButton';

export const HOME_DESIGN = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/a81cc0d80_IMG_0204.jpg';

const ZONES = [
  { label: 'Ana Sayfa', path: '/', left: 1, width: 20 },
  { label: 'Sohbet', path: '/arkadaslar?view=chats', activePath: '/arkadaslar', left: 21, width: 18 },
  { label: 'Oyunlar', path: '/?oyunlar=1', left: 39, width: 22 },
  { label: 'Profil', path: '/profil', left: 79, width: 20 },
];

/** Alt menü: gönderilen tasarım görseli + görünmez dokunma alanları. */
export default function HomeImageNav({ onNav, isAdmin, supportBadge, messages = 0, keyboardInset = 0 }) {
  return (
    <nav aria-label="Ana menü" className="home-image-nav lg:hidden fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)]"
      style={{ background: '#0a0a0d', transform: `translateY(-${keyboardInset}px)` }}>
      <div className="relative mx-auto w-full max-w-[36rem]" style={{ aspectRatio: '1024 / 341' }}>
        <img src={HOME_DESIGN} alt="" draggable="false" className="absolute inset-0 h-full w-full object-fill select-none pointer-events-none" />
        {ZONES.map((z) => (
          <button key={z.label} type="button" aria-label={z.label} onClick={() => onNav(z)}
            className="absolute top-[10%] h-[80%] rounded-2xl active:bg-white/10"
            style={{ left: `${z.left}%`, width: `${z.width}%` }}>
            {z.activePath === '/arkadaslar' && messages > 0 && (
              <span className="absolute right-[12%] top-[8%] min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{messages > 99 ? '99+' : messages}</span>
            )}
          </button>
        ))}
        <div className="absolute top-[10%] h-[80%] overflow-hidden rounded-2xl" style={{ left: '61%', width: '18%' }}>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-[3]">
            {isAdmin ? <LiveChatButton placement="dock" /> : <UserSupportButton badge={supportBadge} />}
          </div>
        </div>
      </div>
    </nav>
  );
}