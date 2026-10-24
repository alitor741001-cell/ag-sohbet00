import { useEffect } from 'react';
import RoomDirectMessages from '@/components/player/RoomDirectMessages';
import VoiceViewport from '@/components/voice/VoiceViewport';

/**
 * Özel sohbet sesli odada tam ekran açılır; cihazın geri tuşu odaya döner.
 * Oda, panel tam ekran olduğu için altındaki yerleşimi daraltmaz.
 */
export default function VoicePrivateChatSheet({ open, initialUserId, onClose, onExpandChange }) {
  useEffect(() => { onExpandChange?.(open); }, [open, onExpandChange]);

  if (!open) return null;

  return (
    <VoiceViewport className="voice-private-chat z-[250]">
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#040b1c]">
        <RoomDirectMessages initialUserId={initialUserId} onClose={onClose} />
      </div>
    </VoiceViewport>
  );
}