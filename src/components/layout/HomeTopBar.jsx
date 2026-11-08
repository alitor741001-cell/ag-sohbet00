import { Link, useLocation } from 'react-router-dom';
import { Flame, Heart, Plus, Search } from 'lucide-react';

// Ana sayfanın üst şeridi: solda marka, sağda dört neon düğme.
const ITEMS = [
  { key: 'hot', label: 'Sıcak', to: '/', Icon: Flame },
  { key: 'follow', label: 'Takip', to: '/?takip=1', Icon: Heart },
  { key: 'search', label: 'Ara', to: '/arama', Icon: Search },
  { key: 'create', label: 'Oda Kur', to: '/oda-kur', Icon: Plus, accent: true },
];

/** Ana sayfanın üst menüsü: görsel yerine CSS ile çizilen hafif neon düğmeler. */
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
        className="flex h-9 shrink-0 items-center rounded-xl border border-primary/45 bg-[#120a0d]/80 px-2.5 text-[12px] font-black tracking-[0.14em] text-white shadow-[0_0_16px_-4px_rgba(239,68,68,0.9)] active:scale-95"
      >
        AG
      </Link>

      <nav aria-label="Ana sayfa menüsü" className="flex min-w-0 flex-1 gap-1.5">
        {ITEMS.map(({ key, label, to, Icon, accent }) => {
          const on = activeKey === key;
          return (
            <Link
              key={key}
              to={to}
              aria-current={on ? 'page' : undefined}
              className={
                accent
                  ? 'flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-primary/60 bg-gradient-to-b from-[#ef4343] to-[#a51d1d] px-1.5 py-1.5 text-[10.5px] font-black text-white shadow-[0_0_18px_-4px_rgba(239,68,68,1)] active:scale-95'
                  : on
                    ? 'flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-primary/50 bg-primary/15 px-1.5 py-1.5 text-[10.5px] font-black text-white shadow-[0_0_16px_-4px_rgba(239,68,68,0.9)] active:scale-95'
                    : 'flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-1.5 py-1.5 text-[10.5px] font-bold text-white/70 active:scale-95'
              }
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