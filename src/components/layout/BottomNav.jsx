import { useLocation, useNavigate } from 'react-router-dom';
import { Crown, Gamepad2, Home, MessageCircle, User } from 'lucide-react';
import { useCurrentUser, membershipActive } from '@/lib/useCurrentUser';
import useSocialBadges from '@/hooks/useSocialBadges';
import useSupportBadge from '@/hooks/useSupportBadge';
import LiveChatButton from '@/components/layout/LiveChatButton';
import UserSupportButton from '@/components/layout/UserSupportButton';
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

  // Alt menü, kullanıcının gönderdiği tasarım görselinin alt şeridiyle birebir çizilir.
  const slots = [
    { label: 'Ana Sayfa', path: '/' },
    { label: 'Sohbet', path: '/arkadaslar?view=chats', activePath: '/arkadaslar' },
    { label: 'Oyunlar', path: membershipActive(user) ? '/?oyunlar=1' : '/' },
    { dock: 'support' },
    { label: 'Profil', path: '/profil' },
  ];
  return (
    <nav aria-label="Ana menü" className="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)]" style={{ background: '#050b1e', transform: `translateY(-${keyboardInset}px)`, transition: keyboardInset ? 'transform 180ms ease-out' : 'none' }}>
      <div className="relative w-full" style={{ aspectRatio: '682 / 190', backgroundImage: "url(https://media.base44.com/images/public/6a77d66e4da6de214628ee62/61568ee02_IMG_0140.jpg)", backgroundSize: '100% auto', backgroundPosition: 'bottom', backgroundRepeat: 'no-repeat' }}>
        <div className="absolute inset-x-0 bottom-0 top-[18%] flex">
          {slots.map((item, index) => item.dock === 'support' ? (
            <div key="support" className="relative flex-1 opacity-0 [&_*]:!h-full [&_*]:!w-full">
              {user?.role === 'admin' ? <LiveChatButton placement="dock" /> : <UserSupportButton badge={supportBadge} />}
            </div>
          ) : (
            <button key={index} type="button" aria-label={item.label} onClick={() => handleNav(item)} className="relative flex-1 active:bg-white/10 rounded-2xl">
              {item.activePath === '/arkadaslar' && messages > 0 && <span className="absolute right-[18%] top-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{messages > 99 ? '99+' : messages}</span>}
              {item.activePath === '/arkadaslar' && requests > 0 && <span className="absolute right-[30%] top-0 w-3 h-3 rounded-full bg-red-500" />}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}