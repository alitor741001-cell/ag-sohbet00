import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import useRoomMusicVolume from '@/hooks/useRoomMusicVolume';
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
  const audioRef = useRef(null);
  const { volume, setVolume, resume } = useRoomMusicVolume(audioRef);
  // Müzik mikrofon durumundan bağımsız bir ses çıkışıdır.
  const wantPlayRef = useRef(false);

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

  // Liste kişiye özeldir: bir kez okunur, şarkı değişiminde yeniden istenmez.
  useEffect(() => { fetchLibrary(); }, [fetchLibrary]);

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
    if (music.is_playing) { resume(); audio.play().catch(() => {}); }
    else audio.pause();
  }, [music, resume]);

  // iOS sesi ancak bir dokunuştan sonra serbest bırakır: ilk dokunuşta çalma yeniden denenir.
  useEffect(() => {
    const unlock = () => {
      const audio = audioRef.current;
      resume();
      if (audio && wantPlayRef.current && audio.paused) audio.play().catch(() => {});
    };
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('pointerdown', unlock);
    return () => {
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('pointerdown', unlock);
    };
  }, [resume]);

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
      const response = await withTimeout(base44.functions.invoke('voice-room', {
        room_id: roomId,
        action: 'music-set',
        title: String(file.name || '').replace(/\.[^.]+$/, '').slice(0, 80) || 'Şarkı',
        file_uri: uploaded.file_uri,
        url: signed.signed_url,
      }));
      if (response?.timeout) return 'timeout';
      if (response?.error) return 'error';
      setMusic(response.data?.music || null);
      await withTimeout(fetchLibrary());
      return 'ok';
    } catch (error) {
      return error?.response?.status === 429 ? 'busy' : 'error';
    } finally {
      setUploading(false);
    }
  }, [roomId, fetchLibrary]);

  // Listeden şarkı açma: bağlantının süresi dolduğu için dosya her seferinde yeniden imzalanır.
  const playTrack = useCallback(async (track) => {
    if (!track?.file_uri || !roomId) return 'empty';
    try {
      const signed = await withTimeout(base44.integrations.Core.CreateFileSignedUrl({ file_uri: track.file_uri, expires_in: URL_TTL }));
      if (signed?.timeout || !signed?.signed_url) return signed?.error?.response?.status === 429 ? 'busy' : 'error';
      const response = await base44.functions.invoke('voice-room', {
        room_id: roomId,
        action: 'music-set',
        title: String(track.title || 'Şarkı').slice(0, 80),
        file_uri: track.file_uri,
        url: signed.signed_url,
      });
      setMusic(response.data?.music || null);
      return 'ok';
    } catch (error) {
      return error?.response?.status === 429 ? 'busy' : 'error';
    }
  }, [roomId]);

  // Sıradaki şarkı: listede bir sonraki; son şarkıdaysa başa döner.
  const playNext = useCallback(async () => {
    if (!library.length) return 'empty';
    const index = library.findIndex((track) => track.file_uri === music?.file_uri);
    const next = library[(index + 1 + library.length) % library.length];
    if (!next || next.file_uri === music?.file_uri) return 'empty';
    return playTrack(next);
  }, [library, music?.file_uri, playTrack]);

  return { music, library, volume, setVolume, audioRef, uploading, uploadTrack, playTrack, playNext, control };
}