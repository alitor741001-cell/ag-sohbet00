import { Link } from 'react-router-dom';
import { Flame, Star, Search, Gift, Crown } from 'lucide-react';

const GOLD_PILL = {
  background: 'linear-gradient(180deg,#2a1a08 0%,#120c06 100%)',
  border: '1.5px solid #f2b347',
  boxShadow: '0 0 14px -2px rgba(255,170,40,0.85), inset 0 0 10px rgba(255,170,40,0.25)',
};
const BLUE_PILL = {
  background: 'linear-gradient(180deg,#0c1f4a 0%,#06122c 100%)',
  border: '1.5px solid #3d8bff',
  boxShadow: '0 0 14px -2px rgba(60,140,255,0.85), inset 0 0 10px rgba(60,140,255,0.25)',
};

/** Ana sayfa üst şeridi: tasarımdaki altın/mavi neon çerçeve, ortada AG amblemi. */
export default function HomeTopBar({ view = 'hot', onView, onSearch, showViews = true }) {
  const chip = (key, label, Icon, color, style) => (
    <button
      type="button"
      onClick={() => onView?.(key)}
      className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-bold text-white transition active:scale-95"
      style={{ ...style, opacity: view === key ? 1 : 0.75 }}
    >
      <Icon className="h-4 w-4" style={{ color, fill: color }} /> {label}
    </button>
  );

  return (
    <div
      className="sticky top-0 z-30 -mx-4 mb-3 px-2 pb-2 pt-[calc(env(safe-area-inset-top)+8px)] sm:-mx-6"
      style={{ background: 'linear-gradient(180deg,#040b1c 0%,rgba(4,11,28,0.92) 80%,transparent 100%)' }}
    >
      <div
        className="relative flex items-center gap-1.5 rounded-full px-1.5 py-1.5"
        style={{
          border: '1.5px solid rgba(70,140,255,0.8)',
          boxShadow: '0 0 18px -4px rgba(60,140,255,0.9), inset 0 0 14px rgba(255,170,40,0.12)',
          background: 'rgba(5,14,36,0.85)',
        }}
      >
        {showViews && chip('hot', 'Sıcak', Flame, '#ff9a1f', GOLD_PILL)}
        {showViews && chip('history', 'Takip', Star, '#3fb4ff', BLUE_PILL)}

        <div className="pointer-events-none mx-auto flex flex-col items-center">
          <Crown className="-mb-1 h-3.5 w-3.5 text-[#f6c544]" style={{ fill: '#f6c544' }} />
          <span
            className="flex h-9 w-10 items-center justify-center text-[15px] font-black italic"
            style={{
              clipPath: 'polygon(50% 100%, 0 70%, 0 0, 100% 0, 100% 70%)',
              background: 'linear-gradient(180deg,#ffe48a 0%,#d9921d 100%)',
              color: '#1a1206',
            }}
          >
            AG
          </span>
        </div>

        <button type="button" onClick={onSearch} aria-label="Üye numarasıyla ara"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white active:scale-95" style={BLUE_PILL}>
          <Search className="h-4 w-4" />
        </button>
        <Link to="/oda-kur" className="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-bold text-[#ffd36b] active:scale-95" style={GOLD_PILL}>
          <Gift className="h-4 w-4 text-[#ffc23a]" /> Oda Kur
        </Link>
      </div>
    </div>
  );
}