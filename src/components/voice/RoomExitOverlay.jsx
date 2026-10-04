import { Minimize2, Power } from 'lucide-react';

/**
 * Odadan çıkma menüsü: şeffaf koyu zemin üzerinde iki beyaz yuvarlak buton.
 * Yalnızca butonlar ve etiketleri görünür; arkadaki koltuklar görünmeye devam eder.
 */
export default function RoomExitOverlay({ open, onClose, onMinimize, onLeave }) {
  if (!open) return null;

  const actions = [
    { key: 'minimize', icon: Minimize2, label: 'Odayı Küçült', onClick: onMinimize },
    { key: 'leave', icon: Power, label: 'Odadan Çık', onClick: onLeave },
  ];

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-gradient-to-b from-[#1a1529]/70 to-[#2d2642]/70 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div className="flex flex-col items-center gap-7" onClick={(event) => event.stopPropagation()}>
        {actions.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className="flex flex-col items-center gap-2 transition-transform active:scale-95"
          >
            <span className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-white shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
              <item.icon className="h-7 w-7 text-[#2D2D2D]" strokeWidth={1.75} />
            </span>
            <span className="text-sm font-medium text-white">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}