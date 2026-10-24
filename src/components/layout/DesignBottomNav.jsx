import { Link } from 'react-router-dom';
import SupportLabel from '@/components/layout/SupportLabel';

export const DESIGN_IMAGE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/f729cdeba_IMG_0210.jpg';

const ITEMS = [
  { label: 'Ana Sayfa', to: '/', x: 3.5, w: 17.5 },
  { label: 'Sohbet', to: '/arkadaslar?view=chats', x: 23, w: 17.5 },
  { label: 'Oyunlar', to: '/?oyunlar=1', x: 41.5, w: 17.5 },
  { label: 'Canlı Destek', to: '/destek', x: 60, w: 18.5 },
  { label: 'Profil', to: '/profil', x: 79.5, w: 17 },
];

/** Tasarım görselinin alt menü şeridi; her sekme gerçek sayfaya gider. */
export default function DesignBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[540px]" style={{ transform: 'translateZ(0)' }}>
      <div className="relative w-full overflow-hidden" style={{ height: 'calc(min(100vw, 540px) * 144 / 540 + env(safe-area-inset-bottom))' }}>
        <img src={DESIGN_IMAGE} alt="" draggable={false} className="pointer-events-none absolute bottom-0 left-0 w-full select-none" />
        <div className="absolute inset-x-0 bottom-0" style={{ aspectRatio: '540 / 144' }}>
          <SupportLabel top="46.5%" height="25%" />
          {ITEMS.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              aria-label={item.label}
              className="absolute top-[8%] h-[70%] rounded-2xl active:bg-white/10"
              style={{ left: `${item.x}%`, width: `${item.w}%` }}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}