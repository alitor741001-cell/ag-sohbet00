import { useLocation, useNavigate } from 'react-router-dom';
import { Home, MessageCircle, Plus, User } from 'lucide-react';
import { useCurrentUser, membershipActive } from '@/lib/useCurrentUser';
import useSocialBadges from '@/hooks/useSocialBadges';
import LiveChatButton from '@/components/layout/LiveChatButton';
import UserSupportButton from '@/components/layout/UserSupportButton';
import useKeyboardInset from '@/hooks/useKeyboardInset';

const fullItems = [
  { label: 'Ana Sayfa', path: '/', icon: Home },
  { label: 'Sohbet', path: '/arkadaslar?view=chats', activePath: '/arkadaslar', icon: MessageCircle },
  { label: 'Oda Kur', path: '/oda-kur', icon: Plus },
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
  // Klavye açılınca alt menü klavyenin üstüne kayar: en altta sabit kalır, arada kaybolmaz.
  const keyboardInset = useKeyboardInset();
  const baseItems = membershipActive(user) ? fullItems : limitedItems;
  // Canlı destek düğmesi herkeste profil sekmesinin hemen solunda durur.
  const items = [...baseItems.slice(0, -1), { dock: 'support' }, ...baseItems.slice(-1)];

  // Profil butonu doğrudan profil sayfasına gider.
  const handleNav = (item) => navigate(item.path);

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 overflow-hidden pb-[env(safe-area-inset-bottom)]" style={{ background: 'linear-gradient(180deg, #2a1508 0%, #1a0b06 45%, #0d0503 100%)', borderTop: '1px solid rgba(242,206,107,0.4)', transform: keyboardInset ? `translateY(-${keyboardInset}px)` : 'translateY(0)', transition: 'transform 180ms ease-out' }}>
      {/* Altın sarısı + kırmızı tonlar: alt menü zemini. */}
      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `linear-gradient(rgba(242,206,107,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.08) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }} />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -bottom-6 left-1/4 w-24 h-24 rounded-full blur-3xl opacity-30 animate-pulse" style={{ background: 'radial-gradient(circle, #dc2626, transparent 70%)' }} />
        <div className="absolute -bottom-4 right-1/4 w-24 h-24 rounded-full blur-3xl opacity-25 animate-pulse" style={{ background: 'radial-gradient(circle, #f2ce6b, transparent 70%)', animationDelay: '1.5s' }} />
      </div>

      <div className="relative flex h-16 items-center">
        {items.map((item, index) => {
          if (item.dock === 'support') {
            return (
              <div key={`dock-${index}`} className="flex-1 flex flex-col items-center justify-center gap-0.5">
                {user?.role === 'admin' ? <LiveChatButton placement="dock" /> : <UserSupportButton />}
                <span className="text-[10px] text-white/50">Canlı Destek</span>
              </div>
            );
          }
          const { label, path, activePath, icon: Icon } = item;
          const matchPath = activePath || path;
          const active = location.pathname === matchPath || (matchPath !== '/' && location.pathname.startsWith(matchPath));
          const isCenter = path === '/oda-kur' && baseItems === fullItems;
          if (isCenter) {
            return (
              <button key={path} onClick={() => handleNav({ path })} className="flex-1 flex flex-col items-center justify-center gap-0.5 relative">
                <span className="-mt-6 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90" style={{ background: 'linear-gradient(135deg, #dc2626, #f2ce6b)', boxShadow: '0 0 18px rgba(242,206,107,0.6)' }}>
                  <Icon className="w-6 h-6 text-white" />
                </span>
                <span className="text-[10px] text-[#f2ce6b]/85 font-medium">{label}</span>
              </button>
            );
          }
          return (
            <button key={path} onClick={() => handleNav({ path, activePath })} className="flex-1 flex flex-col items-center justify-center gap-0.5 relative active:scale-95 transition-transform">
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-full" style={{ background: 'linear-gradient(90deg, #dc2626, #f2ce6b)', boxShadow: '0 0 10px rgba(242,206,107,0.75)' }} />}
              <Icon className={`w-5 h-5 ${active ? 'text-[#f2ce6b]' : 'text-white/50'}`} />
              {activePath === '/arkadaslar' && messages > 0 && <span className="absolute right-[18%] top-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{messages > 99 ? '99+' : messages}</span>}
              {activePath === '/arkadaslar' && requests > 0 && <span className="absolute right-[30%] top-0 w-3 h-3 rounded-full bg-red-500 border-2 border-[#14141a]" aria-label="Yeni arkadaşlık isteği" />}
              <span className={`text-[10px] ${active ? 'text-[#f2ce6b] font-semibold' : 'text-white/50'}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}