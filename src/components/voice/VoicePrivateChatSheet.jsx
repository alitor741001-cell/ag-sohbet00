import { useEffect } from 'react';
import RoomDirectMessages from '@/components/player/RoomDirectMessages';
import { ART } from '@/lib/designArt';

/**
 * Özel sohbet sesli odada yarım yükseklikte açılır: koltuklar görünür kalır.
 * Arka plan ana sayfadaki özel sohbet bölümünün tasarım zeminidir.
 */
export default function VoicePrivateChatSheet({ open, initialUserId, onClose, onExpandChange }) {
  useEffect(() => { if (!open) onExpandChange?.(false); }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[250] flex flex-col justify-end">
      <div
        className="relative flex w-full flex-col overflow-hidden rounded-t-3xl border-t border-white/10"
        style={{ height: '55dvh' }}
      >
        <img
          src={ART.pageBg}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
        />
        <div className="relative flex h-full min-h-0 flex-col pt-[env(safe-area-inset-top)]">
          <RoomDirectMessages initialUserId={initialUserId} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}