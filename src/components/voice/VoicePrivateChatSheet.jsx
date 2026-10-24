import { useEffect, useState } from 'react';
import RoomDirectMessages from '@/components/player/RoomDirectMessages';
import VoiceViewport from '@/components/voice/VoiceViewport';

/**
 * Özel sohbet sesli odada 7. koltuk hizasına kadar açılan bir panel olarak gelir;
 * odanın koltukları panelin üstünde kalan alanda görünür kalır. Panelden bir mesaj
 * açıldığında tam ekrana geçer, geri dönünce yeniden 7. koltuk hizasına iner.
 */
export default function VoicePrivateChatSheet({ open, initialUserId, onClose, onExpandChange }) {
  const [full, setFull] = useState(false);

  // Panel kapandığında oda yerleşimi normale döner.
  useEffect(() => { if (!open) setFull(false); }, [open]);

  const handleFullChange = (next) => {
    setFull(next);
    onExpandChange?.(next);
  };

  if (!open) return null;

  return (
    <VoiceViewport className="voice-private-chat z-[250] justify-end">
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
    </VoiceViewport>
  );
}