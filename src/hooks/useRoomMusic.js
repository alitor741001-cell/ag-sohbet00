import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

const VOLUME_KEY = 'filmykeyfi:roomMusicVolume';
// Telefondan seçilen şarkı için üst sınır: yükleme uzun sürmesin.
const MAX_TRACK_MB = 25;
// İmzalı bağlantı ömrü: platform 1 saatten uzun süreyi reddeder, şarkı bu yüzden hiç açılmıyordu.
const URL_TTL = 3600;
// Telefondan yükleme askıda kalmasın: süre aşılırsa hata bildirilir, düğme kilitli kalmaz.
const UPLOAD_TIMEOUT_MS = 90000;

/** Yükleme/imzalama çağrısını bekler; süre aşılırsa { timeout: true } döner. */
const withTimeout = (promise) => Promise.race([
  promise.catch((error) => ({ error })),
  new Promise((resolve) => { window.setTimeout(() => resolve({ timeout: true }), UPLOAD_TIMEOUT_MS); }),
]);

/**
 * Oda müziği: odanın açık şarkısını canlı izler ve herkesin kendi telefonunda çalar.
 * Konum sunucu saatine göre hizalanır; ses seviyesi cihazda saklanır.
 */
export default function useRoomMusic(roomId, enabled) {
  const [music, setMusic] = useState(null);
  const [library, setLibrary] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [volume, setVolume] = useState(() => {
    const stored = Number(window.localStorage.getItem(VOLUME_KEY));
    return Number.isFinite(stored) && stored > 0 ? Math.min(1, stored) : 0.8;
  });
  const audioRef = useRef(null);
  // Müziğin çalması gerekiyor mu: iOS ses kilidini açarken bu bilgi kullanılır.
  const wantPlayRef = useRef(false);

  // Ses seviyesi bu cihazda kalır: müziği herkes kendi telefonunda kısıp açar.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    window.localStorage.setItem(VOLUME_KEY, String(volume));
  }, [volume]);

  // Odanın şarkı listesi: yüklenen şarkılar burada birikir, listeden tek dokunuşla açılır.
  const fetchLibrary = useCallback(async () => {
    if (!roomId || !enabled) return;
    try {
      const response = await base44.functions.invoke('voice-room', { room_id: roomId, action: 'music-library' });
      setLibrary(response?.data?.tracks || []);
    } catch {
      setLibrary([]);
    }
  }, [roomId, enabled]);

  useEffect(() => { fetchLibrary(); }, [fetchLibrary]);

  // Başka bir yönetici şarkı açtığında liste de tazelenir.
  useEffect(() => { if (music?.file_uri) fetchLibrary(); }, [music?.file_uri, fetchLibrary]);

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
    wantPlayRef.current = !!music?.is_playing;
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

  // iOS sesi ancak bir dokunuştan sonra serbest bırakır: ilk dokunuşta çalma yeniden denenir.
  useEffect(() => {
    const unlock = () => {
      const audio = audioRef.current;
      if (audio && wantPlayRef.current && audio.paused) audio.play().catch(() => {});
    };
    window.addEventListener('touchstart', unlock, { once: true });
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => {
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('pointerdown', unlock);
    };
  }, []);

  const control = useCallback(async (op) => {
    await base44.functions.invoke('voice-room', { room_id: roomId, action: 'music-control', op }).catch(() => {});
  }, [roomId]);

  // Telefondan seçilen şarkı gizli yüklenir, imzalı bağlantısı alınır ve odanın müziği olur.
  const uploadTrack = useCallback(async (file) => {
    if (!file || !roomId) return 'empty';
    if (file.size > MAX_TRACK_MB * 1024 * 1024) return 'too-large';
    setUploading(true);
    try {
      const uploaded = await withTimeout(base44.integrations.Core.UploadPrivateFile({ file }));
      if (uploaded?.timeout) return 'timeout';
      if (uploaded?.error || !uploaded?.file_uri) return uploaded?.error?.response?.status === 429 ? 'busy' : 'error';
      const signed = await withTimeout(base44.integrations.Core.CreateFileSignedUrl({ file_uri: uploaded.file_uri, expires_in: URL_TTL }));
      if (signed?.timeout || !signed?.signed_url) return signed?.error?.response?.status === 429 ? 'busy' : 'error';
      await base44.functions.invoke('voice-room', {
        room_id: roomId,
        action: 'music-set',
        title: String(file.name || '').replace(/\.[^.]+$/, '').slice(0, 80) || 'Şarkı',
        file_uri: uploaded.file_uri,
        url: signed.signed_url,
      });
      return 'ok';
    } catch (error) {
      return error?.response?.status === 429 ? 'busy' : 'error';
    } finally {
      setUploading(false);
    }
  }, [roomId]);

  // Listeden şarkı açma: bağlantının süresi dolduğu için dosya her seferinde yeniden imzalanır.
  const playTrack = useCallback(async (track) => {
    if (!track?.file_uri || !roomId) return 'empty';
    setUploading(true);
    try {
      const signed = await withTimeout(base44.integrations.Core.CreateFileSignedUrl({ file_uri: track.file_uri, expires_in: URL_TTL }));
      if (signed?.timeout || !signed?.signed_url) return signed?.error?.response?.status === 429 ? 'busy' : 'error';
      await base44.functions.invoke('voice-room', {
        room_id: roomId,
        action: 'music-set',
        title: String(track.title || 'Şarkı').slice(0, 80),
        file_uri: track.file_uri,
        url: signed.signed_url,
      });
      return 'ok';
    } catch (error) {
      return error?.response?.status === 429 ? 'busy' : 'error';
    } finally {
      setUploading(false);
    }
  }, [roomId]);

  return { music, library, volume, setVolume, audioRef, uploading, uploadTrack, playTrack, control };
}