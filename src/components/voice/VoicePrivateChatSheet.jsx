import { useEffect, useState } from 'react';
import RoomDirectMessages from '@/components/player/RoomDirectMessages';

// Hediye kartının (oda şeridinin altındaki elmas kartı) alt hizası panelin üst kenarıdır.
const GIFT_PILL = '[data-room-gift-pill]';

function measureTop() {
  const viewport = window.innerHeight;
  const rect = document.querySelector(GIFT_PILL)?.getBoundingClientRect();
  if (!rect || rect.bottom <= 0 || rect.bottom >= viewport * 0.75) return Math.round(viewport * 0.42);
  return Math.round(rect.bottom + 2);
}

/**
 * Sesli odadaki özel sohbet, hediye kartının alt hizasından ekranın en altına kadar açılır.
 * Zemin ana sayfadaki özel sohbetle aynı tek parça tasarım görselidir; aşağıda boşluk kalmaz.
 */
export default function VoicePrivateChatSheet({ open, initialUserId, onClose, onExpandChange }) {
  const [top, setTop] = useState(0);

  useEffect(() => { if (!open) onExpandChange?.(false); }, [open]);

  // Panel açılırken ve ekran döndüğünde hediye kartının hizası yeniden ölçülür.
  useEffect(() => {
    if (!open) return undefined;
    const update = () => setTop(measureTop());
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="dark fixed inset-0 z-[250] flex flex-col justify-end">
      <div
        className="relative flex w-full flex-col overflow-hidden"
        style={{
          height: `calc(100dvh - ${top}px)`,
          // Tema görseli kaldırıldı: sohbet düz koyu yüzeyde açılır, açılış hafiftir.
          backgroundColor: '#0b0b0f',
          '--room-theme-image': 'none',
          '--room-theme-tint': 'none',
        }}
      >
        <div className="relative flex h-full min-h-0 flex-col">
          <RoomDirectMessages initialUserId={initialUserId} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}