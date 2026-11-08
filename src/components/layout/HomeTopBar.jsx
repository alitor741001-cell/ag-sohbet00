import { Link, useLocation } from 'react-router-dom';
import { Flame, Heart, Plus, Search } from 'lucide-react';

// Ana sayfanın üst şeridi: solda başlar, dört alevli renkli düğme yan yana durur.
// Her düğmenin rengi kendi içinde akar ve ışığı nefes alır: canlı, alevli görünür.
const ITEMS = [
  {
    key: 'hot', label: 'Sıcak', to: '/', Icon: Flame,
    bg: 'linear-gradient(115deg,#ffe08a 0%,#ff9a3c 38%,#e8340a 74%,#8f1100 100%)',
    glow: '0 0 16px -2px rgba(255,138,43,0.95)',
    border: 'border-orange-200/70',
  },
  {
    key: 'follow', label: 'Takip', to: '/?takip=1', Icon: Heart,
    bg: 'linear-gradient(115deg,#ffd0e2 0%,#ff5c8a 40%,#c4145a 76%,#6d0730 100%)',
    glow: '0 0 16px -2px rgba(255,92,138,0.95)',
    border: 'border-pink-200/70',
  },
  {
    key: 'search', label: 'Ara', to: '/arama', Icon: Search,
    bg: 'linear-gradient(115deg,#a9f0ff 0%,#4fc3ff 40%,#1567e0 76%,#08307d 100%)',
    glow: '0 0 16px -2px rgba(79,195,255,0.95)',
    border: 'border-sky-200/70',
  },
  {
    key: 'create', label: 'Oda Kur', to: '/oda-kur', Icon: Plus,
    bg: 'linear-gradient(115deg,#fff6b0 0%,#ffe266 42%,#e0a000 78%,#8a6000 100%)',
    glow: '0 0 16px -2px rgba(255,214,64,0.95)',
    border: 'border-yellow-100/80',
  },
];

/** Ana sayfanın üst menüsü: marka yazısı yok, düğmeler soldan başlar. */
export default function HomeTopBar() {
  const { pathname, search } = useLocation();
  const activeKey = pathname === '/'
    ? (new URLSearchParams(search).get('takip') === '1' ? 'follow' : 'hot')
    : '';

  return (
    <header className="flex items-center px-2.5 pb-1.5 pt-2">
      <nav aria-label="Ana sayfa menüsü" className="flex min-w-0 flex-1 gap-1.5">
        {ITEMS.map(({ key, label, to, Icon, bg, glow, border }) => {
          const on = activeKey === key;
          return (
            <Link
              key={key}
              to={to}
              aria-current={on ? 'page' : undefined}
              className={`flame-live flex min-w-0 flex-1 items-center justify-center gap-1 rounded-2xl border px-1.5 py-[7px] text-[10.5px] font-black text-white active:scale-95 ${border} ${on ? 'ring-2 ring-white/80' : 'opacity-95'}`}
              style={{ backgroundImage: bg, boxShadow: glow }}
            >
              <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]" strokeWidth={2.6} />
              <span className="truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">{label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}