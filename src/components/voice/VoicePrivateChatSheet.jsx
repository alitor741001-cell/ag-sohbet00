import { useEffect } from 'react';
import RoomDirectMessages from '@/components/player/RoomDirectMessages';

/**
 * Özel sohbet sesli odada ana sayfadaki özel sohbetin birebir aynısı olarak
 * tam ekran açılır: aynı başlık tasarımı, aynı sekmeler ve aynı sohbet ekranı.
 */
export default function VoicePrivateChatSheet({ open, initialUserId, onClose, onExpandChange }) {
  useEffect(() => { if (!open) onExpandChange?.(false); }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex flex-col justify-end"
      style={{
        backgroundColor: 'var(--app-shell-color, #02030c)',
        backgroundImage: 'var(--room-theme-image, none), var(--room-theme-tint, none)',
        backgroundSize: 'cover, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
      }}
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden pt-[env(safe-area-inset-top)]">
        <RoomDirectMessages initialUserId={initialUserId} onClose={onClose} />
      </div>
    </div>
  );
}