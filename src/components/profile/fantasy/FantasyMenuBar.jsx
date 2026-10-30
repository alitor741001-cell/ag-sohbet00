import { useWhiteCutout } from '@/lib/whiteCutout';

const BAR_IMAGE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/0387b7026_IMG_0484.jpg';
const CROP = { x: 0, y: 0, w: 1, h: 1 };

/**
 * Profil alt menüsü: kristal ejder çerçeveli şerit (Yönetim · Engellenen Hesaplar · Ayarlar).
 * Görselin beyaz zemini kaldırılır, üç eşit bölge görünmez dokunma alanı olarak çalışır.
 */
export default function FantasyMenuBar({ onAdmin, onBlocked, onSettings }) {
  // Görsel kırpılır ve beyaz zemin yumuşak kenarla şeffaf yapılır: arka plan görünmez.
  const src = useWhiteCutout(BAR_IMAGE, CROP);
  const zones = [
    { key: 'admin', label: 'Yönetim', action: onAdmin },
    { key: 'blocked', label: 'Engellenen Hesaplar', action: onBlocked },
    { key: 'settings', label: 'Ayarlar', action: onSettings },
  ];

  return (
    <div className="relative w-full">
      {src ? (
        <img src={src} alt="Profil menüsü" draggable={false} className="block h-auto w-full select-none" />
      ) : (
        <div className="h-24 w-full" aria-hidden="true" />
      )}
      {src && (
        <div className="absolute inset-0 grid grid-cols-3">
          {zones.map((zone) => (
            <button
              key={zone.key}
              type="button"
              onClick={zone.action}
              aria-label={zone.label}
              className="rounded-xl transition-colors active:bg-white/10"
            />
          ))}
        </div>
      )}
    </div>
  );
}