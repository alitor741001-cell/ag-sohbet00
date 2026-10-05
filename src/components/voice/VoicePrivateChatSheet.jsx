import { useEffect, useRef, useState } from 'react';
import RoomDirectMessages from '@/components/player/RoomDirectMessages';

/**
 * Özel sohbet: ekranın dibinden yarıya kadar altın-kırmızı bir panel olarak açılır.
 * Panelden bir mesaj açıldığında tam ekrana geçer; geri tuşuna basıldığında
 * yarım panele dönmeden özel sohbet alanı tümüyle kapanır.
 */
export default function VoicePrivateChatSheet({ open, initialUserId, onClose }) {
  const [full, setFull] = useState(false);
  const wasFullRef = useRef(false);

  useEffect(() => {
    if (!open) { setFull(false); wasFullRef.current = false; }
  }, [open]);

  // Tam ekrandan geri dönüş: yarım panele inmek yerine paneli kapatır.
  const handleFullChange = (next) => {
    if (wasFullRef.current && !next) {
      wasFullRef.current = false;
      setFull(false);
      onClose();
      return;
    }
    wasFullRef.current = next;
    setFull(next);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[250] flex flex-col justify-end">
      {!full && (
        <button type="button" aria-label="Kapat" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
      )}
      <div
        className={
          full
            ? 'relative flex h-full w-full flex-col overflow-hidden bg-[#150A0A]'
            : 'animate-sheet-up relative flex h-[56dvh] w-full flex-col overflow-hidden rounded-t-[26px] bg-gradient-to-b from-[#2C1512] to-[#150A0A] ring-1 ring-[#F2CE6B]/40'
        }
      >
        {!full && <span className="mx-auto mt-2 h-1 w-10 shrink-0 self-center rounded-full bg-[#F2CE6B]/60" />}
        <div className="flex min-h-0 flex-1 flex-col">
          <RoomDirectMessages initialUserId={initialUserId} onClose={onClose} onFullScreenChange={handleFullChange} />
        </div>
      </div>
    </div>
  );
}