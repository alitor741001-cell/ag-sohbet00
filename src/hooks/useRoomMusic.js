import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
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
  // Çalma oturumu: aynı şarkı yeniden başlatıldığında sesin başa alınması için izlenir.
  const sessionRef = useRef('');

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

  // Oda değişince önceki odanın şarkısı anında susar: yeni odanın müzik durumu gelene kadar
  // eski şarkı çalmaya devam etmez, iki odanın sesi birbirine karışmaz.
  useEffect(() => {
    setMusic(null);
    setLibrary([]);
    const audio = audioRef.current;
    if (!audio) return undefined;
    audio.pause();
    audio.removeAttribute('src');
    delete audio.dataset.track;
    return undefined;
  }, [roomId]);

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
    const unsubscribe = subscribeEntity('RoomMusic', (event) => {
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
    const position = Number(music.position) || 0;
    const target = Math.max(0, position + elapsed);
    const started = music.started_at || '';
    // Yeni çalma oturumu: duraklatıp yeniden başlatılan ya da durdurulan şarkı baştan çalar.
    const restarted = !!started && started !== sessionRef.current;
    if (started) sessionRef.current = started;
    if (restarted && position === 0 && audio.readyState > 0) {
      try { audio.currentTime = 0; } catch { /* dosya hazır değilse konum atlanamaz */ }
    } else if (Math.abs((audio.currentTime || 0) - target) > 1.5) {
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

  // Duraklatma ve durdurma bu cihazda anında uygulanır: düğme sunucu turunu beklemez,
  // müzik hemen susar. Sunucu kaydı arkadan güncellenir ve odaya yayılır.
  const control = useCallback(async (op) => {
    const audio = audioRef.current;
    if (audio && (op === 'stop' || op === 'pause')) {
      wantPlayRef.current = false;
      audio.pause();
      if (op === 'stop') {
        try { audio.currentTime = 0; } catch { /* dosya hazır değilse konum atlanamaz */ }
        setMusic((current) => (current ? { ...current, is_playing: false, position: 0, started_at: '' } : current));
      } else {
        setMusic((current) => (current ? { ...current, is_playing: false, position: audio.currentTime || current.position } : current));
      }
    }
    await base44.functions.invoke('voice-room', { room_id: roomId, action: 'music-control', op }).catch(() => {});
  }, [roomId]);

  // Telefondan seçilen şarkılar (birden fazla olabilir) gizli yüklenir ve yalnızca
  // kendi listene eklenir. Yükleme müziği başlatmaz: şarkı listeden dokununca çalar.
  const uploadTracks = useCallback(async (files) => {
    const list = (Array.isArray(files) ? files : [files]).filter(Boolean);
    if (!roomId || !list.length) return { status: 'empty', added: 0, skipped: 0 };
    const allowed = list.filter((file) => file.size <= MAX_TRACK_MB * 1024 * 1024);
    const skipped = list.length - allowed.length;
    if (!allowed.length) return { status: 'too-large', added: 0, skipped };
    setUploading(true);
    let status = 'ok';
    const tracks = [];
    try {
      // Dosyalar tek tek yüklenir: biri takılırsa diğerleri yine listeye girer.
      for (const file of allowed) {
        const uploaded = await withTimeout(base44.integrations.Core.UploadPrivateFile({ file }));
        if (uploaded?.timeout) { status = 'timeout'; break; }
        if (uploaded?.error || !uploaded?.file_uri) { status = uploaded?.error?.response?.status === 429 ? 'busy' : 'error'; break; }
        tracks.push({
          title: String(file.name || '').replace(/\.[^.]+$/, '').slice(0, 80) || 'Şarkı',
          file_uri: uploaded.file_uri,
        });
      }
      if (!tracks.length) return { status, added: 0, skipped };
      const response = await withTimeout(base44.functions.invoke('voice-room', { room_id: roomId, action: 'music-add', tracks }));
      if (response?.timeout) return { status: 'timeout', added: 0, skipped };
      if (response?.error) return { status: response.error?.response?.status === 429 ? 'busy' : 'error', added: 0, skipped };
      await withTimeout(fetchLibrary());
      return { status: 'ok', added: response.data?.created?.length || tracks.length, skipped };
    } catch (error) {
      return { status: error?.response?.status === 429 ? 'busy' : 'error', added: 0, skipped };
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

  // Kendi listenden şarkı silme: kayıt sunucudan kaldırılır, liste yenilenir.
  const removeTrack = useCallback(async (track) => {
    if (!track?.id || !roomId) return 'empty';
    try {
      const response = await withTimeout(base44.functions.invoke('voice-room', { room_id: roomId, action: 'music-remove', track_id: track.id }));
      if (response?.timeout) return 'timeout';
      if (response?.error) return 'error';
      setLibrary((rows) => rows.filter((row) => row.id !== track.id));
      await withTimeout(fetchLibrary());
      return 'ok';
    } catch (error) {
      return error?.response?.status === 429 ? 'busy' : 'error';
    }
  }, [roomId, fetchLibrary]);

  // Sıradaki şarkı: listede bir sonraki; son şarkıdaysa başa döner.
  const playNext = useCallback(async () => {
    if (!library.length) return 'empty';
    const index = library.findIndex((track) => track.file_uri === music?.file_uri);
    const next = library[(index + 1 + library.length) % library.length];
    if (!next || next.file_uri === music?.file_uri) return 'empty';
    return playTrack(next);
  }, [library, music?.file_uri, playTrack]);

  return { music, library, volume, setVolume, audioRef, uploading, uploadTracks, playTrack, removeTrack, playNext, control };
}