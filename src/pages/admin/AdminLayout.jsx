import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Loader2, LayoutDashboard, Users, Film, MessageSquare, CreditCard, Bell, Send, Tag, Flag, Shield, Settings, Video, Monitor, RefreshCw, UserCog } from 'lucide-react';

const menu = [
  { label: 'Panel', path: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Kullanıcılar', path: '/admin/kullanicilar', icon: Users },
  { label: 'Roller', path: '/admin/roller', icon: UserCog },
  { label: 'Filmler', path: '/admin/filmler', icon: Film },
  { label: 'Kategoriler', path: '/admin/kategoriler', icon: Tag },
  { label: 'Destek', path: '/admin/destek', icon: MessageSquare },
  { label: 'Ödemeler', path: '/admin/odeme', icon: CreditCard },
  { label: 'Bildirimler', path: '/admin/bildirimler', icon: Bell },
  { label: 'Telegram', path: '/admin/telegram', icon: Send },
  { label: 'Güvenlik', path: '/admin/guvenlik', icon: Shield },
  { label: 'Şikayetler', path: '/admin/sikayetler', icon: Flag },
  { label: 'Ayarlar', path: '/admin/ayarlalar', icon: Settings },
  { label: 'Tanıtım Videosu', path: '/admin/tanitim-videosu', icon: Video },
  { label: 'Oturumlar', path: '/admin/oturumlar', icon: Monitor },
  { label: 'Güncellemeler', path: '/admin/guncellemeler', icon: RefreshCw },
];

export default function AdminLayout() {
  const { user, loading } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin' && user.role !== 'moderator') { navigate('/'); return; }
    setChecking(false);
  }, [user, loading]);

  if (checking || loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-60 border-r border-border bg-card/50 flex flex-col shrink-0 hidden md:flex">
        <div className="p-4 border-b border-border"><h1 className="text-lg font-bold text-white">Admin Panel</h1></div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {menu.map((m) => {
            const active = m.exact ? location.pathname === m.path : location.pathname.startsWith(m.path);
            return (
              <Link key={m.path} to={m.path} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${active ? 'bg-purple-600 text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
                <m.icon className="w-4 h-4" /> {m.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-border"><Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-white/5"><LayoutDashboard className="w-4 h-4" /> Siteye Dön</Link></div>
      </aside>
      <div className="flex-1 overflow-y-auto">
        <div className="md:hidden bg-card border-b border-border p-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {menu.map((m) => {
            const active = m.exact ? location.pathname === m.path : location.pathname.startsWith(m.path);
            return <Link key={m.path} to={m.path} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${active ? 'bg-purple-600 text-white' : 'bg-white/5 text-muted-foreground'}`}><m.icon className="w-3 h-3" /> {m.label}</Link>;
          })}
        </div>
        <div className="p-4 md:p-6"><Outlet /></div>
      </div>
    </div>
  );
}