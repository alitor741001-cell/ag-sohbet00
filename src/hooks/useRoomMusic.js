import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

const VOLUME_KEY = 'filmykeyfi:roomMusicVolume';
// Telefondan seçilen şarkı için üst sınır: yükleme uzun sürmesin.
const MAX_TRACK_MB = 15;
// İmzalı bağlantı şarkı boyunca geçerli kalır (6 saat).
const URL_TTL = 21600;

/**
 * Oda müziği: odanın açık şarkısını canlı izler ve herkesin kendi telefonunda çalar.
 * Konum sunucu saatine göre hizalanır; ses seviyesi cihazda saklanır.
 */
export default function useRoomMusic(roomId, enabled) {
  const [music, setMusic] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [volume, setVolume] = useState(() => {
    const stored = Number(window.localStorage.getItem(VOLUME_KEY));
    return Number.isFinite(stored) && stored > 0 ? Math.min(1, stored) : 0.8;
  });
  const audioRef = useRef(null);

  // Ses seviyesi bu cihazda kalır: müziği herkes kendi telefonunda kısıp açar.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    window.localStorage.setItem(VOLUME_KEY, String(volume));
  }, [volume]);

  // Şarkı kaydı canlı izlenir: odaya sonradan giren de çalan şarkıyı alır.
  useEffect(() => {
    if (!roomId || !enabled) {
      setMusic(null);
      return undefined;
    }
    let alive = true;
    base44.functions.invoke('voice-room', { room_id: roomId, action: 'music-state' })
      .then((response) => { if (alive) setMusic(response?.data?.music || null); })
      .catch(() => {});
    const unsubscribe = base44.entities.RoomMusic.subscribe((event) => {
      const row = event?.data;
      if (!row || row.room_id !== roomId) return;
      setMusic(event.type === 'delete' ? null : row);
    });
    return () => { alive = false; unsubscribe(); };
  }, [roomId, enabled]);

  // Oynatma: çalıyor/duraklatıldı bilgisi ve pozisyon sunucudan gelir, cihaz kendini hizalar.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!music?.url) {
      audio.pause();
      return;
    }
    const trackKey = music.file_uri || music.url;
    if (audio.dataset.track !== trackKey) {
      audio.dataset.track = trackKey;
      audio.src = music.url;
    }
    const elapsed = music.is_playing && music.started_at
      ? Math.max(0, (Date.now() - new Date(music.started_at).getTime()) / 1000)
      : 0;
    const target = Math.max(0, (Number(music.position) || 0) + elapsed);
    if (Math.abs((audio.currentTime || 0) - target) > 1.5) {
      try { audio.currentTime = target; } catch { /* dosya yüklenmeden konum atlanamaz */ }
    }
    if (music.is_playing) audio.play().catch(() => {});
    else audio.pause();
  }, [music]);

  const control = useCallback(async (op) => {
    await base44.functions.invoke('voice-room', { room_id: roomId, action: 'music-control', op }).catch(() => {});
  }, [roomId]);

  // Telefondan seçilen şarkı gizli yüklenir, imzalı bağlantısı alınır ve odanın müziği olur.
  const uploadTrack = useCallback(async (file) => {
    if (!file || !roomId) return 'empty';
    if (file.size > MAX_TRACK_MB * 1024 * 1024) return 'too-large';
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: URL_TTL });
      await base44.functions.invoke('voice-room', {
        room_id: roomId,
        action: 'music-set',
        title: String(file.name || '').replace(/\.[^.]+$/, '').slice(0, 80) || 'Şarkı',
        file_uri,
        url: signed_url,
      });
      return 'ok';
    } catch (error) {
      return error?.response?.status === 429 ? 'busy' : 'error';
    } finally {
      setUploading(false);
    }
  }, [roomId]);

  return { music, volume, setVolume, audioRef, uploading, uploadTrack, control };
}