import { Link } from 'react-router-dom';
import { Bell, Castle } from 'lucide-react';

const ICON_BTN =
  'flex h-9 w-9 items-center justify-center rounded-full border border-[#e8c47c]/45 bg-[#0b2144]/75 text-[#f0d79b] shadow-[inset_0_0_12px_rgba(79,216,207,0.22)] backdrop-blur transition active:scale-95';

/** Ana sayfa üst şeridi: kristal kapsül etiket ve sağ üstte oda kurma düğmesi. */
export default function HomeTopBar() {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Link
        to="/acik-odalar"
        className="rounded-full px-4 py-1.5 text-[11px] font-black tracking-[0.08em] text-[#062033] shadow-[0_0_20px_-4px_rgba(127,240,230,0.9)] active:scale-95"
        style={{ background: 'linear-gradient(135deg,#d8fffb 0%,#6fe6dc 48%,#9ad7ff 100%)' }}
      >
        Sıcak
      </Link>
      <span className="text-[11.5px] font-bold tracking-wide text-white/45">Geçmiş Odalar</span>

      <div className="ml-auto flex items-center gap-1.5">
        <Link to="/bildirimler" aria-label="Bildirimler" className={ICON_BTN}>
          <Bell className="h-4 w-4" />
        </Link>
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