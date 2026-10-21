import { useLocation, useNavigate } from 'react-router-dom';
import { Gamepad2, Home, MessageCircle, User } from 'lucide-react';
import { useCurrentUser, membershipActive } from '@/lib/useCurrentUser';
import useSocialBadges from '@/hooks/useSocialBadges';
import useSupportBadge from '@/hooks/useSupportBadge';
import LiveChatButton from '@/components/layout/LiveChatButton';
import UserSupportButton from '@/components/layout/UserSupportButton';
import useKeyboardInset from '@/hooks/useKeyboardInset';
import { TAB_PATHS } from '@/lib/tabPaths';

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
  // Destek düğmesinde özel sohbetlerdeki gibi okunmamış yanıt sayısı görünür.
  const supportBadge = useSupportBadge(user?.id);
  // Klavye açılınca alt menü klavyenin üstüne kayar: en altta sabit kalır, arada kaybolmaz.
  const keyboardInset = useKeyboardInset();
  const baseItems = membershipActive(user) ? fullItems : limitedItems;
  // Canlı destek düğmesi herkeste profil sekmesinin hemen solunda durur.
  const items = [...baseItems.slice(0, -1), { dock: 'support' }, ...baseItems.slice(-1)];

  // Aynı sekmeye tekrar basıldığında kök görünüme dönülür: iç içe adres parametreleri
  // (ör. /arkadaslar?chat=…, /profil?tab=…) temizlenir ve sayfa başına kaydırılır.
  const handleNav = (item) => {
    const [targetPath, targetSearch = ''] = item.path.split('?');
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

  return (
    <nav aria-label="Ana menü" className="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)]" style={{ background: 'linear-gradient(180deg, rgba(16,54,80,0.94) 0%, rgba(13,34,74,0.97) 46%, rgba(6,11,28,0.99) 100%)', borderTop: '1px solid rgba(127,240,230,0.42)', backdropFilter: 'blur(14px)', boxShadow: '0 -12px 32px -18px rgba(127,240,230,0.7)', transform: keyboardInset ? `translateY(-${keyboardInset}px)` : 'translateY(0)', transition: 'transform 180ms ease-out' }}>
      {/* Kristal dalga hattı: menünün üst kenarı akışkan bir çizgiyle parlar. */}
      <svg aria-hidden="true" viewBox="0 0 400 10" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 -top-px h-2.5 w-full">
        <defs>
          <linearGradient id="navWave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7ff0e6" stopOpacity="0.15" />
            <stop offset="45%" stopColor="#7ff0e6" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#c9a3ff" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <path d="M0 7 C 48 0, 92 10, 150 5 S 268 0, 330 6 S 382 10, 400 4" fill="none" stroke="url(#navWave)" strokeWidth="1.6" />
      </svg>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-8 left-1/2 h-24 w-44 -translate-x-1/2 rounded-full blur-2xl opacity-40" style={{ background: 'radial-gradient(circle, rgba(127,240,230,0.7), transparent 70%)' }} />
        <div className="absolute -bottom-8 left-4 h-24 w-24 rounded-full blur-3xl opacity-30 animate-pulse" style={{ background: 'radial-gradient(circle, #7c5cff, transparent 70%)' }} />
        <div className="absolute -bottom-6 right-4 h-24 w-24 rounded-full blur-3xl opacity-25 animate-pulse" style={{ background: 'radial-gradient(circle, #f2ce6b, transparent 70%)', animationDelay: '1.5s' }} />
      </div>

      {/* Sekmeler tablet ve geniş ekranlarda ortada toplanır: menü ekrana yayılmaz,
          telefonda ise tam genişlik korunur. */}
      <div className="relative mx-auto flex h-16 w-full max-w-[36rem] items-center">
        {items.map((item, index) => {
          if (item.dock === 'support') {
            return (
              <div key={`dock-${index}`} className="flex-1 flex flex-col items-center justify-center gap-0.5">
                {user?.role === 'admin' ? <LiveChatButton placement="dock" /> : <UserSupportButton badge={supportBadge} />}
                <span className="text-[10px] font-semibold text-[#dcecff]/80">Canlı Destek</span>
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
                    background: 'radial-gradient(circle at 50% 24%, #e8fffc 0%, #4fd8cf 32%, #2a6fb5 66%, #121b3d 100%)',
                    border: '2px solid rgba(240,206,120,0.92)',
                    boxShadow: '0 0 0 4px rgba(6,17,38,0.92), 0 0 30px rgba(79,216,207,0.65), inset 0 -8px 14px rgba(0,0,0,0.5)',
                  }}
                >
                  <span aria-hidden="true" className="absolute inset-1.5 rounded-full" style={{ background: 'radial-gradient(circle at 50% 16%, rgba(255,255,255,0.7), transparent 58%)' }} />
                  <span aria-hidden="true" className="absolute -right-1 top-2 h-1.5 w-1.5 rounded-full bg-white/90 blur-[1px]" />
                  <Icon className="relative h-8 w-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.85)]" />
                </span>
                <span className="text-[10px] font-black tracking-wide" style={{ color: '#ffe6a8' }}>{label}</span>
              </button>
            );
          }
          return (
            <button key={path} type="button" aria-current={active ? 'page' : undefined}
              aria-label={activePath === '/arkadaslar' && messages > 0 ? `${label}, ${messages} okunmamış mesaj` : undefined}
              onClick={() => handleNav({ path, activePath })} className="flex-1 flex flex-col items-center justify-center gap-1 relative min-h-11 active:scale-95 transition-transform">
              {active && <span aria-hidden="true" className="absolute top-0 h-[2px] w-9 rounded-full" style={{ background: 'linear-gradient(90deg, #7ff0e6, #ffe6a8)', boxShadow: '0 0 12px rgba(127,240,230,0.9)' }} />}
              {active && (
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-3 top-0 h-9 rounded-2xl blur-md" style={{ background: 'radial-gradient(circle, rgba(127,240,230,0.55), transparent 70%)' }} />
              )}
              <Icon aria-hidden="true" className="relative h-[19px] w-[19px]" style={{ color: active ? '#ffe6a8' : 'rgba(226,240,255,0.78)', filter: active ? 'drop-shadow(0 0 7px rgba(255,214,120,0.85))' : 'none' }} />
              {activePath === '/arkadaslar' && messages > 0 && <span aria-hidden="true" className="absolute right-[18%] top-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{messages > 99 ? '99+' : messages}</span>}
              {activePath === '/arkadaslar' && requests > 0 && <span aria-hidden="true" className="absolute right-[30%] top-0 w-3 h-3 rounded-full bg-red-500 border-2 border-[#14141a]" />}
              <span className="relative text-[9.5px] font-semibold leading-none" style={{ color: active ? '#ffe6a8' : 'rgba(226,240,255,0.78)' }}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}