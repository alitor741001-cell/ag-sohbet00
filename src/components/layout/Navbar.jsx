import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Image } from '@/components/ui/image';
import ProfileDropdown from '@/components/layout/ProfileDropdown';
import SearchSuggestions from '@/components/search/SearchSuggestions';
import LiveChatButton from '@/components/layout/LiveChatButton';
import SupportNotifBell from '@/components/layout/SupportNotifBell';
import WelcomeOverlay from '@/components/WelcomeOverlay';
import { useCurrentUser } from '@/lib/useCurrentUser';

const links = [
  { label: 'Ana Sayfa', path: '/' },
  { label: 'Filmler', path: '/filmler' },
  { label: 'Açık Odalar', path: '/acik-odalar' },
  { label: 'Kategoriler', path: '/kategoriler' },
  { label: 'Listem', path: '/listem' },
  { label: 'Arkadaşlar', path: '/arkadaslar' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useCurrentUser();
  const [q, setQ] = useState('');

  useEffect(() => {
    setQ(location.pathname === '/ara' ? new URLSearchParams(location.search).get('q') || '' : '');
  }, [location.pathname, location.search]);

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/ara?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 pt-[max(env(safe-area-inset-top),1.5rem)] lg:pt-0"
      style={{ background: 'linear-gradient(135deg, #151517 0%, #242428 50%, #151517 100%)', borderBottom: '1px solid rgba(239,68,68,0.25)' }}>
      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `linear-gradient(rgba(239,68,68,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.07) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-8 -left-10 hidden sm:block w-32 h-32 rounded-full blur-3xl opacity-25" style={{ background: 'radial-gradient(circle, #dc2626, transparent 70%)' }} />
        <div className="absolute -top-4 right-20 hidden sm:block w-24 h-24 rounded-full blur-3xl opacity-15" style={{ background: 'radial-gradient(circle, #9ca3af, transparent 70%)' }} />
      </div>

      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Image src="https://media.base44.com/images/public/6a77d66e4da6de214628ee62/3108d3b4e_351A5169-7769-4C41-8816-B20112620648.png" alt="FILMKEYFİ" className="h-10 w-10 rounded-lg" fittingType="fill" />
        </Link>
        <WelcomeOverlay />

        <nav className="hidden lg:flex items-center gap-1 ml-4">
            {links.map((l) => (
              <Link key={l.path} to={l.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === l.path ? 'text-white bg-red-500/15 shadow-[0_0_14px_rgba(239,68,68,0.3)]' : 'text-white/60 hover:text-white hover:bg-red-500/10'}`}>
                {l.label}
              </Link>
            ))}
          </nav>

        <form onSubmit={submit} className="relative hidden md:flex items-center ml-auto bg-white/5 rounded-full px-3 py-1.5 w-44 lg:w-64 focus-within:ring-2 focus-within:ring-red-500/30">
            <Search className="w-4 h-4 text-white/40 shrink-0" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Film, dizi ara..." autoComplete="off"
              className="bg-transparent outline-none px-2 text-sm w-full placeholder:text-white/40 text-white" />
            <SearchSuggestions query={q} onSelect={() => setQ('')} />
          </form>

        <div className="flex items-center gap-2 ml-auto md:ml-2">
          <SupportNotifBell />
          {user?.role === 'admin' && <LiveChatButton />}
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}