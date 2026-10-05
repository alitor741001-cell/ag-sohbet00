import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { clearMinimizedFilm, getMinimizedFilm, subscribeMinimizedFilm } from '@/lib/minimizedFilm';
import { clearMinimizedRoom } from '@/lib/minimizedRoom';
import { disposeVoiceSession } from '@/lib/roomVoiceSession';

/**
 * Küçültülmüş film odasının küçük oynatıcısı: oda küçültüldüğünde film arka planda
 * oynamaya devam eder. Karta dokununca odaya dönülür, üstteki X ile odadan çıkılır.
 */
export default function MinimizedFilmPlayer() {
  const film = useSyncExternalStore(subscribeMinimizedFilm, getMinimizedFilm);
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const lastSyncRef = useRef(0);

  // iOS'ta sesli oynatma kullanıcı dokunuşuyla açılır: dokunuşta yeniden denenir.
  useEffect(() => {
    if (!film) return;
    const retry = () => videoRef.current?.play().catch(() => {});
    window.addEventListener('pointerdown', retry);
    return () => window.removeEventListener('pointerdown', retry);
  }, [film]);

  if (!film) return null;

  // Film başladığı yerden devam eder; oda sahibi filmi sürdürürken odanın zamanı tazelenir.
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

  const returnToRoom = () => {
    clearMinimizedFilm(film.roomId);
    clearMinimizedRoom();
    navigate(film.path);
  };

  const leaveRoom = async () => {
    // Odadan tamamen çıkılır: arka planda süren mikrofon yayını da kapatılır.
    disposeVoiceSession(film.roomId);
    await base44.functions.invoke('room-presence', { action: 'leave', room_id: film.roomId }).catch(() => {});
    clearMinimizedFilm(film.roomId);
    clearMinimizedRoom();
  };

  return (
    <div className="fixed left-3 z-[240] flex flex-col items-start" style={{ bottom: 'calc(4.75rem + env(safe-area-inset-bottom))' }}>
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
        onClick={returnToRoom}
        aria-label="Odaya dön"
        className="relative block w-40 overflow-hidden rounded-xl border border-amber-400/60 bg-black shadow-2xl transition-transform active:scale-95"
      >
        <video
          ref={videoRef}
          src={film.src}
          autoPlay
          playsInline
          crossOrigin="anonymous"
          onLoadedMetadata={startPlayback}
          onTimeUpdate={syncRoomTime}
          className="h-[92px] w-full bg-black object-cover"
        />
        <span className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
          {film.title || 'Film odası'} · devam ediyor
        </span>
      </button>
    </div>
  );
}