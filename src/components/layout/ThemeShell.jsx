import { Link } from 'react-router-dom';

const BG = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/0de9b6ed9_IMG_0214.jpg';

const ZONES = [
  { label: 'Ana Sayfa', to: '/', x: 3, w: 18 },
  { label: 'Sohbet', to: '/arkadaslar?view=chats', x: 23, w: 17.5 },
  { label: 'Oyunlar', to: '/?oyunlar=1', x: 41.5, w: 17.5 },
  { label: 'Arkadaşlar', to: '/destek', x: 60, w: 18.5 },
  { label: 'Profil', to: '/profil', x: 79.5, w: 17 },
];

/** Tam ekran tema arka planı + görseldeki alt butonlar için dokunma alanları. */
export default function ThemeShell() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: '#000' }} aria-hidden="true">
        <img src={BG} alt="" draggable={false} className="h-full w-full select-none object-fill" />
      </div>
      {['inset(0 0 89% 0)', 'inset(85% 0 0 0)'].map((clip) => (
        <img key={clip} src={BG} alt="" aria-hidden="true" draggable={false} className="pointer-events-none fixed inset-0 z-40 h-full w-full select-none object-fill" style={{ clipPath: clip }} />
      ))}
      {ZONES.map((z) => (
        <Link
          key={z.label}
          to={z.to}
          aria-label={z.label}
          className="fixed z-50 rounded-2xl active:bg-white/10"
          style={{ left: `${z.x}%`, width: `${z.w}%`, top: '87%', height: '9.5%' }}
        />
      ))}
    </>
  );
}