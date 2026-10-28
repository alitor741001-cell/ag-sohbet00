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
    <div className="fixed inset-0 z-[250] flex flex-col justify-end bg-[#02030c]">
      <div className="relative flex h-full w-full flex-col overflow-hidden pt-[env(safe-area-inset-top)]">
        <RoomDirectMessages initialUserId={initialUserId} onClose={onClose} />
      </div>
    </div>
  );
}