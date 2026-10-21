import { Link } from 'react-router-dom';
import { Castle, Search } from 'lucide-react';

const ICON_BTN =
  'flex h-9 w-9 items-center justify-center rounded-full border border-[#e8c47c]/45 bg-[#0b2144]/75 text-[#f0d79b] shadow-[inset_0_0_12px_rgba(79,216,207,0.22)] backdrop-blur transition active:scale-95';

const ACTIVE_CHIP = {
  background: 'linear-gradient(135deg,#d8fffb 0%,#6fe6dc 48%,#9ad7ff 100%)',
  color: '#062033',
  boxShadow: '0 0 20px -4px rgba(127,240,230,0.9)',
};

/** Ana sayfa üst şeridi: Sıcak / Geçmiş Odalar sekmeleri, üye arama ve oda kurma. */
export default function HomeTopBar({ view = 'hot', onView, onSearch }) {
  return (
    <div className="mb-3 flex items-center gap-1.5">
      {[
        { key: 'hot', label: 'Sıcak' },
        { key: 'history', label: 'Geçmiş Odalar' },
      ].map((item) => {
        const active = view === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onView?.(item.key)}
            className={`rounded-full px-3.5 py-1.5 text-[11px] font-black tracking-[0.04em] transition active:scale-95 ${
              active
                ? ''
                : 'border border-[#e8c47c]/35 bg-[#071736]/70 text-white/60 backdrop-blur'
            }`}
            style={active ? ACTIVE_CHIP : undefined}
          >
            {item.label}
          </button>
        );
      })}

      <div className="ml-auto flex items-center gap-1.5">
        <button type="button" onClick={onSearch} aria-label="Üye numarasıyla ara" className={ICON_BTN}>
          <Search className="h-4 w-4" />
        </button>
        <Link
          to="/oda-kur"
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[10.5px] font-black text-[#062033] shadow-[0_0_20px_-4px_rgba(127,240,230,0.9)] active:scale-95"
          style={{ background: 'linear-gradient(135deg,#d8fffb 0%,#6fe6dc 48%,#9ad7ff 100%)' }}
        >
          <Castle className="h-3.5 w-3.5" /> Oda Kur
        </Link>
      </div>
    </div>
  );
}