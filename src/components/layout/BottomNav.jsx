import { useLocation, useNavigate } from 'react-router-dom';
import { Gamepad2, Home, MessageCircle, User } from 'lucide-react';
import { useCurrentUser, membershipActive } from '@/lib/useCurrentUser';
import useSocialBadges from '@/hooks/useSocialBadges';
import useSupportBadge from '@/hooks/useSupportBadge';
import LiveChatButton from '@/components/layout/LiveChatButton';
import UserSupportButton from '@/components/layout/UserSupportButton';
import HomeImageNav from '@/components/layout/HomeImageNav';
import useKeyboardInset from '@/hooks/useKeyboardInset';
import { TAB_PATHS } from '@/lib/tabPaths';
import preloadRoute from '@/lib/routePreload';

const fullItems = [
  { label: 'Ana Sayfa', path: '/', icon: Home },
  { label: 'Sohbet', path: '/arkadaslar?view=chats', activePath: '/arkadaslar', icon: MessageCircle },
  { label: 'Oyunlar', path: '/?oyunlar=1', icon: Gamepad2 },
  { label: 'Profil', path: '/profil', icon: User },
];

const limitedItems = [
  { label: 'Ana Sayfa', path: '/', icon: Home },
  { label: 'Sohbet', path: '/arkadaslar?view=chats', activePath: '/arkadaslar', icon: MessageCircle },
  { label: 'Profil', path: '/profil', icon: User },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { messages, requests } = useSocialBadges(user?.id);
  // Sesli odada kendi kontrol çubuğu vardır: ana menü odanın altında şerit olarak görünmez.
  const inVoiceRoom = /^\/sesli-oda\//.test(location.pathname);
  // Destek düğmesinde özel sohbetlerdeki gibi okunmamış yanıt sayısı görünür.
  const supportBadge = useSupportBadge(user?.id);
  // Klavye açılınca alt menü klavyenin üstüne kayar: en altta sabit kalır, arada kaybolmaz.
  const keyboardInset = useKeyboardInset();
  const baseItems = membershipActive(user) ? fullItems : limitedItems;
  // Canlı destek düğmesi herkeste profil sekmesinin hemen solunda durur.
  const items = [...baseItems.slice(0, -1), { dock: 'support' }, ...baseItems.slice(-1)];

  if (inVoiceRoom || location.pathname === '/vip') return null;

  // Aynı sekmeye tekrar basıldığında kök görünüme dönülür: iç içe adres parametreleri
  // (ör. /arkadaslar?chat=…, /profil?tab=…) temizlenir ve sayfa başına kaydırılır.
  const handleNav = (item) => {
    const [targetPath, targetSearch = ''] = item.path.split('?');
    preloadRoute(targetPath);
    if (location.pathname === (item.activePath || targetPath)) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      // Aynı sekmede kalındığı için geçmiş kaydı büyütülmez.
      navigate(targetSearch ? `${targetPath}?${targetSearch}` : targetPath, { replace: true });
      return;
    }
    // Sekme geçişi geçmişe yeni kayıt eklemez: geri tuşu sekmeler arasında dolaşmaz,
    // gerçek önceki sayfaya ya da çıkışa döner. "Oda Kur" bir işlem ekranı olduğu için
    // adım olarak açılır, geri tuşu onu kapatır.
    const isTab = TAB_PATHS.includes(targetPath);
    navigate(item.path, isTab ? { replace: true } : undefined);
  };

  if (location.pathname === '/') {
    return <HomeImageNav onNav={handleNav} isAdmin={user?.role === 'admin'} supportBadge={supportBadge} />;
  }

  return (
    <nav aria-label="Ana menü" className="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"       style={{ background: 'linear-gradient(180deg, #071533 0%, #050e24 100%)', borderTop: '1.5px solid #f2b347', backdropFilter: 'blur(14px)', boxShadow: '0 -6px 20px -6px rgba(255,170,40,0.7), 0 -14px 30px -14px rgba(60,140,255,0.8)', transform: `translateY(-${keyboardInset}px)`, transition: keyboardInset ? 'transform 180ms ease-out' : 'none' }}>
      {/* Kristal dalga hattı: menünün üst kenarı akışkan bir çizgiyle parlar. */}
      <svg aria-hidden="true" viewBox="0 0 400 10" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 -top-px h-2.5 w-full">
        <defs>
          <linearGradient id="navWave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7098a8" stopOpacity="0.2" />
            <stop offset="45%" stopColor="#869fb3" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#a596bb" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <path d="M0 7 C 48 0, 92 10, 150 5 S 268 0, 330 6 S 382 10, 400 4" fill="none" stroke="url(#navWave)" strokeWidth="1.6" />
      </svg>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-8 left-1/2 h-24 w-44 -translate-x-1/2 rounded-full blur-2xl opacity-45" style={{ background: 'radial-gradient(circle, rgba(111,168,232,0.75), transparent 70%)' }} />
        <div className="absolute -bottom-8 left-4 h-24 w-24 rounded-full blur-3xl opacity-30 animate-pulse" style={{ background: 'radial-gradient(circle, #7c5cff, transparent 70%)' }} />
        <div className="absolute -bottom-6 right-4 h-24 w-24 rounded-full blur-3xl opacity-25 animate-pulse" style={{ background: 'radial-gradient(circle, #d4af37, transparent 70%)', animationDelay: '1.5s' }} />
      </div>

      {/* Sekmeler tablet ve geniş ekranlarda ortada toplanır: menü ekrana yayılmaz,
          telefonda ise tam genişlik korunur. */}
      <div className="relative mx-auto flex h-16 w-full max-w-[36rem] items-center">
        {items.map((item, index) => {
          if (item.dock === 'support') {
            return (
              <div key={`dock-${index}`} className="flex-1 flex flex-col items-center justify-center gap-0.5">
                {user?.role === 'admin' ? <LiveChatButton placement="dock" /> : <UserSupportButton badge={supportBadge} />}
                <span className="text-[9.5px] font-semibold text-white/80">Canlı Destek</span>
              </div>
            );
          }
          const { label, path, activePath, icon: Icon } = item;
          const matchPath = activePath || path;
          const active = location.pathname === matchPath || (matchPath !== '/' && location.pathname.startsWith(matchPath));
          const isCenter = path === '/?oyunlar=1' && baseItems === fullItems;
          if (isCenter) {
            return (
              <button key={path} type="button" aria-label={label} onClick={() => handleNav({ path })} className="flex-1 flex flex-col items-center justify-center gap-1 relative min-h-11">
                {/* Ortadaki kristal taş: menünün üstünde süzülür. */}
                <span
                  className="-mt-9 relative flex h-16 w-16 items-center justify-center rounded-full transition-transform active:scale-90"
                  style={{
                    background: 'radial-gradient(circle at 50% 30%, #6fb6ff 0%, #1f5fe0 45%, #0a2266 100%)',
                    border: '3px solid #f2b347',
                    boxShadow: '0 0 0 3px #050e24, 0 0 22px rgba(255,170,40,0.8), 0 0 28px rgba(60,140,255,0.8), inset 0 -8px 14px rgba(0,0,0,0.45)',
                  }}
                >
                  <span aria-hidden="true" className="absolute inset-1.5 rounded-full" style={{ background: 'radial-gradient(circle at 50% 16%, rgba(255,255,255,0.7), transparent 58%)' }} />
                  <span aria-hidden="true" className="absolute -right-1 top-2 h-1.5 w-1.5 rounded-full bg-white/90 blur-[1px]" />
                  <Icon className="relative h-8 w-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.85)]" />
                </span>
                <span className="text-[10px] font-black tracking-wide" style={{ color: '#f4e1a1', textShadow: '0 0 10px rgba(244,225,161,0.55)' }}>{label}</span>
              </button>
            );
          }
          return (
            <button key={path} type="button" aria-current={active ? 'page' : undefined}
              aria-label={activePath === '/arkadaslar' && messages > 0 ? `${label}, ${messages} okunmamış mesaj` : undefined}
              onClick={() => handleNav({ path, activePath })} className="flex-1 flex flex-col items-center justify-center gap-1 relative min-h-11 active:scale-95 transition-transform">
              <span aria-hidden="true" className="absolute bottom-0.5 h-[3px] w-9 rounded-full" style={{ background: active ? '#ffb02e' : '#2f7bff', boxShadow: active ? '0 0 10px rgba(255,176,46,0.9)' : '0 0 8px rgba(47,123,255,0.8)' }} />
              <Icon aria-hidden="true" strokeWidth={1.8} className="relative h-[22px] w-[22px]" style={{ color: active ? '#ffb02e' : '#5aa8ff', filter: active ? 'drop-shadow(0 0 8px rgba(255,176,46,0.8))' : 'drop-shadow(0 0 6px rgba(90,168,255,0.7))' }} />
              {activePath === '/arkadaslar' && messages > 0 && <span aria-hidden="true" className="absolute right-[18%] top-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{messages > 99 ? '99+' : messages}</span>}
              {activePath === '/arkadaslar' && requests > 0 && <span aria-hidden="true" className="absolute right-[30%] top-0 w-3 h-3 rounded-full bg-red-500 border-2 border-[#14141a]" />}
              <span className="relative text-[9.5px] font-semibold leading-none" style={{ color: active ? '#ffc23a' : '#a9cfff' }}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}