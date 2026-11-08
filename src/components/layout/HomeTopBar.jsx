import { Link, useLocation } from 'react-router-dom';
import { Flame, Heart, Plus, Search } from 'lucide-react';

// Ana sayfanın üst şeridi: solda marka, sağda dört renkli ateş düğmesi.
// Her düğme kendi renginde yanar: turuncu, pembe, mavi ve sarı ateş.
const ITEMS = [
  {
    key: 'hot', label: 'Sıcak', to: '/', Icon: Flame,
    tone: 'border-orange-300/60 bg-gradient-to-b from-[#ff9a3c] to-[#c11b0b] text-white shadow-[0_0_18px_-4px_rgba(255,138,43,0.95)]',
  },
  {
    key: 'follow', label: 'Takip', to: '/?takip=1', Icon: Heart,
    tone: 'border-pink-300/60 bg-gradient-to-b from-[#ff5c8a] to-[#a3134a] text-white shadow-[0_0_18px_-4px_rgba(255,92,138,0.95)]',
  },
  {
    key: 'search', label: 'Ara', to: '/arama', Icon: Search,
    tone: 'border-sky-300/60 bg-gradient-to-b from-[#4fc3ff] to-[#0b4fc9] text-white shadow-[0_0_18px_-4px_rgba(79,195,255,0.95)]',
  },
  {
    key: 'create', label: 'Oda Kur', to: '/oda-kur', Icon: Plus,
    tone: 'border-yellow-200/70 bg-gradient-to-b from-[#ffe266] to-[#c98a00] text-[#2a1c00] shadow-[0_0_18px_-4px_rgba(255,226,102,0.95)]',
  },
];

/** Ana sayfanın üst menüsü: görsel yerine CSS ile çizilen renkli ateş düğmeler. */
export default function HomeTopBar() {
  const { pathname, search } = useLocation();
  const activeKey = pathname === '/'
    ? (new URLSearchParams(search).get('takip') === '1' ? 'follow' : 'hot')
    : '';

  return (
    <header className="flex items-center gap-2 px-3 pb-1.5 pt-2">
      <Link
        to="/"
        aria-label="AG Sohbet ana sayfa"
        className="fire-flicker flex h-9 shrink-0 items-center rounded-xl border border-primary/60 bg-gradient-to-b from-[#ef4343] to-[#7a1020] px-2.5 text-[12px] font-black tracking-[0.14em] text-white shadow-[0_0_16px_-3px_rgba(239,68,68,0.95)] active:scale-95"
      >
        AG
      </Link>

      <nav aria-label="Ana sayfa menüsü" className="flex min-w-0 flex-1 gap-1.5">
        {ITEMS.map(({ key, label, to, Icon, tone }) => {
          const on = activeKey === key;
          return (
            <Link
              key={key}
              to={to}
              aria-current={on ? 'page' : undefined}
              className={`fire-flicker flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full border px-1.5 py-1.5 text-[10.5px] font-black active:scale-95 ${tone} ${on ? 'ring-2 ring-white/70' : 'opacity-90'}`}
            >
              <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}