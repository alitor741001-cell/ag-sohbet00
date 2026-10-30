import { useBorderWhiteCutout } from '@/lib/whiteCutout';

const BAR_IMAGE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/6c1e44d65_IMG_0484.jpg';
const CROP = { x: 0, y: 0, w: 1, h: 1 };
const COLUMNS = [
  { key: 'friends', label: 'Arkadaşlar' },
  { key: 'following', label: 'Takip Edilenler' },
  { key: 'followers', label: 'Takipçiler' },
  { key: 'visitors', label: 'Ziyaretçiler' },
];

/**
 * Profil istatistik şeridi: tasarım görseli zeminsiz gösterilir,
 * dört bölge de ilgili listeyi açar.
 */
export default function ProfileStatBar({ onSelect }) {
  const src = useBorderWhiteCutout(BAR_IMAGE, CROP);
  return (
    <div className="relative w-full">
      {src ? (
        <img src={src} alt="Sosyal bağlantılar" draggable={false} className="block h-auto w-full select-none" />
      ) : (
        <div className="h-20 w-full" aria-hidden="true" />
      )}
      {src && (
        <div className="absolute inset-0 grid grid-cols-4">
          {COLUMNS.map((column) => (
            <button
              key={column.key}
              type="button"
              onClick={() => onSelect?.(column.key)}
              aria-label={column.label}
              className="rounded-xl transition-colors active:bg-white/10"
            />
          ))}
        </div>
      )}
    </div>
  );
}