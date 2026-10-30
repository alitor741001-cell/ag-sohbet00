import { useWhiteCutout } from '@/lib/whiteCutout';

const BAR_IMAGE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/22c734d78_IMG_0481.jpg';
const CROP = { x: 0, y: 0, w: 1, h: 1 };

/**
 * Profil kısayol şeridi: Alışveriş Merkezi · Çanta · Seviye · Ajans.
 * Görselin beyaz zemini kaldırılır, dört eşit bölge görünmez dokunma alanı olarak çalışır.
 */
export default function FantasyQuickBar({ onSelect }) {
  const src = useWhiteCutout(BAR_IMAGE, CROP);
  const zones = [
    { key: 'shop', label: 'Alışveriş Merkezi' },
    { key: 'bag', label: 'Çanta' },
    { key: 'level', label: 'Seviye' },
    { key: 'agency', label: 'Ajans' },
  ];

  return (
    <div className="relative w-full">
      {src ? (
        <img src={src} alt="Profil kısayolları" draggable={false} className="block h-auto w-full select-none" />
      ) : (
        <div className="h-24 w-full" aria-hidden="true" />
      )}
      {src && (
        <div className="absolute inset-0 grid grid-cols-4">
          {zones.map((zone) => (
            <button
              key={zone.key}
              type="button"
              onClick={() => onSelect?.(zone.key)}
              aria-label={zone.label}
              className="rounded-xl transition-colors active:bg-white/10"
            />
          ))}
        </div>
      )}
    </div>
  );
}