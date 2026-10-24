import { Link } from 'react-router-dom';
import SupportLabel from '@/components/layout/SupportLabel';

const BG = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/1ac262e7e_IMG_0216.jpg';
export const CHATS_BG = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/489f91051_IMG_0225.jpg';

const ZONES = [
  { label: 'Ana Sayfa', to: '/', x: 3, w: 18 },
  { label: 'Sohbet', to: '/arkadaslar?view=chats', x: 23, w: 17.5 },
  { label: 'Oyunlar', to: '/?oyunlar=1', x: 41.5, w: 17.5 },
  { label: 'Canlı Destek', to: '/destek', x: 60, w: 18.5 },
  { label: 'Profil', to: '/profil', x: 79.5, w: 17 },
];

/** Tam ekran tema arka planı + görseldeki butonlar için dokunma alanları. */
export default function ThemeShell({ chats = false }) {
  const bg = chats ? CHATS_BG : BG;
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: '#000' }} aria-hidden="true">
        <img src={bg} alt="" draggable={false} className="h-full w-full select-none object-fill" />
      </div>
      {/* Alt menü şeridi içeriğin üstünde kalır. */}
      <img src={bg} alt="" aria-hidden="true" draggable={false} className="pointer-events-none fixed inset-0 z-40 h-full w-full select-none object-fill" style={{ clipPath: 'inset(85% 0 0 0)' }} />
      <div className="pointer-events-none fixed inset-0 z-40"><SupportLabel top="92.5%" height="3.5%" /></div>
      {ZONES.map((z) => (
        <Link key={z.label} to={z.to} aria-label={z.label} className="fixed z-50 rounded-2xl active:bg-white/10" style={{ left: `${z.x}%`, width: `${z.w}%`, top: '87%', height: '9.5%' }} />
      ))}
    </>
  );
}