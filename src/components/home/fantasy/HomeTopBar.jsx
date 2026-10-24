import { Link } from 'react-router-dom';
import { Flame, Users, Search, Plus } from 'lucide-react';

const PILL = 'flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-sm font-bold text-white transition active:scale-95';

/** Ana sayfa üst şeridi: düz zemin üzerinde net, okunaklı butonlar. */
export default function HomeTopBar({ onView, onSearch, showViews = true }) {
  return (
    <>
      <div aria-hidden="true" className="h-14 mb-1" />
      <div className="fixed inset-x-0 top-0 z-40 bg-[#0a0a0d] pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 w-full max-w-[36rem] items-center gap-2 px-3">
          {showViews && <button type="button" onClick={() => onView?.('hot')} className={PILL}><Flame className="h-4 w-4 text-orange-400" />Sıcak</button>}
          {showViews && <button type="button" onClick={() => onView?.('history')} className={PILL}><Users className="h-4 w-4 text-sky-400" />Takip</button>}
          <div className="flex-1" />
          <button type="button" aria-label="Üye numarasıyla ara" onClick={onSearch} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white active:scale-95"><Search className="h-5 w-5" /></button>
          <Link to="/oda-kur" className={`${PILL} bg-amber-400 border-amber-300 text-black`}><Plus className="h-4 w-4" />Oda Kur</Link>
        </div>
      </div>
    </>
  );
}