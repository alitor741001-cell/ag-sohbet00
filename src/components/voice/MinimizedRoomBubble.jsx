import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import useDraggableBubble from '@/hooks/useDraggableBubble';
import MinimizedRoomMusic from '@/components/voice/MinimizedRoomMusic';
import { clearMinimizedRoom, getMinimizedRoom, subscribeMinimizedRoom } from '@/lib/minimizedRoom';
import { clearMinimizedFilm, getMinimizedFilm, subscribeMinimizedFilm } from '@/lib/minimizedFilm';
import { disposeVoiceSession } from '@/lib/roomVoiceSession';

/**
 * Küçültülmüş oda balonu: parmakla ekranın her yerine taşınabilen profil çemberi.
 * Müzik ve ses oturumu odadan çıkılsa da sürer; film odası küçültüldüğünde film
 * ayrı pencere açmadan bu çemberin içinde oynamaya devam eder.
 * Üstteki X ile odadan çıkılır, çembere dokununca odaya dönülür.
 */
export default function MinimizedRoomBubble() {
  const room = useSyncExternalStore(subscribeMinimizedRoom, getMinimizedRoom);
  const filmState = useSyncExternalStore(subscribeMinimizedFilm, getMinimizedFilm);
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef(null);
  const lastSyncRef = useRef(0);
  const profiles = useMessageProfiles([room?.owner_id]);
  const profile = profiles[room?.owner_id] || {};
  const name = profile.username || room?.owner_name || 'Sesli oda';
  const film = filmState && filmState.roomId === room?.id ? filmState : null;
  // Çember her yöne taşınır; konum cihazda saklanır, ekran ölçüsü değişince görünür alana çekilir.
  const { pos, boxRef, didDrag, bind } = useDraggableBubble('filmkeyfi_oda_balonu', { measure: true });

  // iOS'ta sesli oynatma kullanıcı dokunuşuyla açılır: dokunuşta yeniden denenir.
  useEffect(() => {
    if (!film) return;
    const retry = () => videoRef.current?.play().catch(() => {});
    window.addEventListener('pointerdown', retry);
    return () => window.removeEventListener('pointerdown', retry);
  }, [film]);

  const closeRoom = async () => {
    if (!room) return;
    const roomId = room.id;
    // Çember anında kaybolur; odadan çıkış arkada tamamlanır.
    clearMinimizedRoom();
    // Arka planda süren ses oturumu ve küçültülmüş film de kapatılır.
    disposeVoiceSession(roomId);
    clearMinimizedFilm(roomId);
    await base44.functions.invoke('voice-room', { action: 'seat-leave', room_id: roomId }).catch(() => {});
    await base44.functions.invoke('room-presence', { action: 'leave', room_id: roomId }).catch(() => {});
  };

  // X ile çıkış: çember sürüklendikten sonraki kazara dokunuş odadan çıkarmasın.
  const leaveRoom = () => { if (!didDrag()) closeRoom(); };

  // Başka bir odanın içindeyken küçültülmüş oda balonu çıkmaz: eski odadan tamamen çıkılır,
  // böylece sağ alttaki çember görünmez ve kişiyi eski odaya geri götürmez.
  const openedRoomId = location.pathname.match(/^\/(?:sesli-oda|oda)\/([^/]+)/)?.[1] || '';
  const insideOtherRoom = !!room && !!openedRoomId && openedRoomId !== room.id;
  useEffect(() => {
    if (insideOtherRoom) closeRoom();
  }, [insideOtherRoom, room?.id]);

  if (!room) return null;

  const openRoom = () => {
    if (didDrag()) return;
    const path = room.path || `/sesli-oda/${room.id}`;
    clearMinimizedRoom();
    navigate(path);
  };

  // Film kaldığı yerden sürer; oda sahibi filmi sürdürürken odanın zamanı tazelenir.
  const startPlayback = (event) => {
    const video = event.currentTarget;
    if (film.time > 0 && Math.abs(video.currentTime - film.time) > 1) video.currentTime = film.time;
    if (film.playing !== false) video.play().catch(() => {});
  };

  const syncRoomTime = (event) => {
    if (!film.isOwner) return;
    if (Date.now() - lastSyncRef.current < 2000) return;
    lastSyncRef.current = Date.now();
    base44.entities.Room.update(film.roomId, {
      current_time: event.currentTarget.currentTime,
      is_playing: !event.currentTarget.paused,
      last_sync: new Date().toISOString(),
    }).catch(() => {});
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[240]">
      {/* Oda küçültüldüğü sürece şarkı burada çalar: sayfa kapansa da müzik kesilmez. */}
      {!film && <MinimizedRoomMusic roomId={room.id} />}
      {/* Sürükleme doğrudan çemberin üstünde: balon ekranın her yerine taşınabilir. */}
      <div
        ref={boxRef}
        {...bind}
        className={`pointer-events-auto fixed flex touch-none flex-col items-center ${film ? 'w-20' : 'w-14'}`}
        style={{ left: pos?.x ?? 0, top: pos?.y ?? 0 }}
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
          className={`relative flex ${film ? 'h-20 w-20' : 'h-14 w-14'} items-center justify-center overflow-hidden rounded-full border-2 border-primary/70 bg-card shadow-2xl transition-transform active:scale-95`}
        >
          {film ? (
            <video
              ref={videoRef}
              src={film.src}
              autoPlay
              playsInline
              crossOrigin="anonymous"
              onLoadedMetadata={startPlayback}
              onTimeUpdate={syncRoomTime}
              className="h-full w-full bg-black object-cover"
            />
          ) : profile.avatar ? (
            <Image src={profile.avatar} alt={name} className="h-full w-full" fittingType="fill" draggable={false} />
          ) : (
            <span className="text-lg font-bold text-white">{name.trim().charAt(0)}</span>
          )}
        </button>
      </div>
    </div>
  );
}