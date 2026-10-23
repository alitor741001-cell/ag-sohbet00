import { Link } from 'react-router-dom';
import { Flame, Gift, Search, Star } from 'lucide-react';

const CREST = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/3aaefd82e_generated_image.png';
const GOLD = { border: '1.5px solid #e8b84a', boxShadow: '0 0 14px -2px rgba(255,190,70,.75), inset 0 0 10px rgba(255,190,70,.25)', background: 'linear-gradient(180deg,#1a1408,#0a0f1e)' };
const BLUE = { border: '1.5px solid #3b8cff', boxShadow: '0 0 14px -2px rgba(59,140,255,.8), inset 0 0 10px rgba(59,140,255,.25)', background: 'linear-gradient(180deg,#0b1a3a,#060d20)' };

/** Ana sayfa üst şeridi: altın/mavi neon çerçeveli Sıcak, Takip, AG arması, arama ve Oda Kur. */
export default function HomeTopBar({ view = 'hot', onView, onSearch, showViews = true }) {
  const chip = (key, label, Icon, color, style) => (
    <button type="button" onClick={() => onView?.(key)} style={style}
      className={`flex h-10 items-center gap-1.5 rounded-full px-3 text-[12px] font-bold text-white transition active:scale-95 ${view === key ? '' : 'opacity-75'}`}>
      <Icon className={`h-4 w-4 ${color}`} fill="currentColor" /> {label}
    </button>
  );
  return (
    <div className="relative mb-4 mt-1 rounded-full px-2 py-2"
      style={{ border: '1.5px solid #3b8cff', background: 'linear-gradient(180deg,rgba(10,22,50,.9),rgba(5,10,25,.9))', boxShadow: '0 0 18px -4px #3b8cff, 0 0 28px -10px #ffb43c' }}>
      <div className="flex items-center gap-1.5">
        {showViews && chip('hot', 'Sıcak', Flame, 'text-orange-400', GOLD)}
        {showViews && chip('history', 'Takip', Star, 'text-sky-400', BLUE)}
        <img src={CREST} alt="AG" className="mx-auto -my-4 h-16 w-16 shrink-0 object-contain mix-blend-screen" />
        <button type="button" onClick={onSearch} aria-label="Üye numarasıyla ara" style={BLUE}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white active:scale-95">
          <Search className="h-4 w-4" />
        </button>
        <Link to="/oda-kur" style={GOLD} className="flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-bold text-white active:scale-95">
          <Gift className="h-4 w-4 text-yellow-400" /> Oda Kur
        </Link>
      </div>
    </div>
  );
}