import { useEffect, useState } from 'react';
import RoomDirectMessages from '@/components/player/RoomDirectMessages';

/**
 * Özel sohbet sesli odada oyun merkeziyle aynı şekilde açılır: ekranı kaplayan
 * karartılı bir örtü ve alttan yükselen yarım panel. Arkadaki koltuklar görünür
 * kalır, yerleşim yukarı kaymaz. Mesaj açılınca tam ekrana geçer.
 */
export default function VoicePrivateChatSheet({ open, initialUserId, onClose, onExpandChange }) {
  const [full, setFull] = useState(false);

  useEffect(() => { if (!open) setFull(false); }, [open]);

  const handleFullChange = (next) => {
    setFull(next);
    onExpandChange?.(next);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[250] flex flex-col justify-end">
      {!full && <button type="button" aria-label="Kapat" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />}
      <div
        className={
          full
            ? 'relative flex h-full w-full flex-col overflow-hidden bg-[#040b1c]'
            : 'animate-sheet-up relative flex h-[var(--voice-dm-height)] w-full flex-col overflow-hidden rounded-t-2xl bg-[#040b1c]'
        }
      >
        <RoomDirectMessages initialUserId={initialUserId} onClose={onClose} onFullScreenChange={handleFullChange} />
      </div>
    </div>
  );
}