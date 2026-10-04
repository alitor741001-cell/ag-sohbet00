import { useRef, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import { clearMinimizedRoom, getMinimizedRoom, subscribeMinimizedRoom } from '@/lib/minimizedRoom';

/**
 * Küçültülmüş oda balonu: sağ altta sürüklenebilir profil çemberi,
 * üstündeki X ile odadan çıkılır, çembere dokununca odaya dönülür.
 */
export default function MinimizedRoomBubble() {
  const room = useSyncExternalStore(subscribeMinimizedRoom, getMinimizedRoom);
  const navigate = useNavigate();
  const bounds = useRef(null);
  const moved = useRef(false);
  const profiles = useMessageProfiles([room?.owner_id]);
  const profile = profiles[room?.owner_id] || {};
  const name = profile.username || room?.owner_name || 'Sesli oda';

  if (!room) return null;

  const openRoom = () => {
    if (moved.current) return;
    clearMinimizedRoom();
    navigate(`/sesli-oda/${room.id}`);
  };

  const leaveRoom = async () => {
    if (moved.current) return;
    await base44.functions.invoke('voice-room', { action: 'seat-leave', room_id: room.id }).catch(() => {});
    await base44.functions.invoke('room-presence', { action: 'leave', room_id: room.id }).catch(() => {});
    clearMinimizedRoom();
  };

  return (
    // Sürükleme alanı tüm ekran: balon yukarı, aşağı, sola ve sağa taşınabilir.
    <div ref={bounds} className="pointer-events-none fixed inset-0 z-[240]">
      <motion.div
        drag
        dragConstraints={{ top: 8, right: 12, bottom: 84, left: 12 }}
        dragMomentum={false}
        dragElastic={0}
        onPointerDown={() => { moved.current = false; }}
        onDragStart={() => { moved.current = true; }}
        className="pointer-events-auto absolute right-3 flex w-14 touch-none flex-col items-center"
        style={{ bottom: 'calc(4.75rem + env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={leaveRoom}
          aria-label="Odadan çık"
          className="mb-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-black/85 text-white shadow-lg transition-transform active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={openRoom}
          aria-label={`${name} odasına dön`}
          className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-primary/70 bg-card shadow-2xl transition-transform active:scale-95"
        >
          {profile.avatar
            ? <Image src={profile.avatar} alt={name} className="h-full w-full" fittingType="fill" draggable={false} />
            : <span className="text-lg font-bold text-white">{name.trim().charAt(0)}</span>}
        </button>
      </motion.div>
    </div>
  );
}