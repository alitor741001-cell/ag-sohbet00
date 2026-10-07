import useRoomMusic from '@/hooks/useRoomMusic';

/**
 * Küçültülmüş odanın müziği: oda sayfası kapandığında şarkı burada, sayfadan
 * bağımsız çalmaya devam eder. Liste, yükleme ve denetleyici burada gerekmez;
 * ses seviyesi odadakiyle aynı cihaz ayarını kullanır.
 */
export default function MinimizedRoomMusic({ roomId }) {
  const music = useRoomMusic(roomId, true, { library: false });
  return <audio ref={music.audioRef} crossOrigin="anonymous" className="hidden" playsInline preload="auto" />;
}