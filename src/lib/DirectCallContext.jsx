import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { claimCallAudioFocus, releaseCallAudioFocus } from '@/lib/callAudioFocus';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { createVoiceOutput, ensureMicTrack, releaseMic, resetAudioRouting, setSpeakerMode, startRingtone, unlockVoicePlayback } from '@/lib/callAudio';
import { useCurrentUser } from '@/lib/useCurrentUser';
import useCallModeration from '@/hooks/useCallModeration';

// Görüşme motoru (LiveKit) yalnızca arama başlarken indirilir: açılış paketi
// yarım megabayt hafifler, çağrı akışı birebir aynı kalır.
let callEnginePromise = null;
let callEngine = null;
const loadCallEngine = () => {
  if (!callEnginePromise) {
    callEnginePromise = Promise.all([
      import('livekit-client'),
      import('@/lib/NativeCallAudio'),
    ]).then(([livekit, engine]) => {
      callEngine = {
        RoomEvent: livekit.RoomEvent,
        Track: livekit.Track,
        createLocalVideoTrack: livekit.createLocalVideoTrack,
        NativeCallAudio: engine.default,
        NativeCallTrack: engine.NativeCallTrack,
      };
      return callEngine;
    });
  }
  return callEnginePromise;
};

const DirectCallContext = createContext(null);
export const useDirectCall = () => useContext(DirectCallContext);

const ENDED_STATUSES = ['rejected', 'ended', 'cancelled', 'missed'];
const CALL_TIMEOUT_MS = 45000;
// webAudioMix kapalı: uzak ses Web Audio'dan geçerse iOS ahize yönlendirmesi bozulur.
const ROOM_OPTIONS = {
  // Birebir aramada uyarlanabilir yayın ve yayın kısıtlama kapalı: sunucu, izleyen taraf
  // hazır olana kadar kamera yayınını duraklatıp görüntünün hiç gelmemesine yol açıyordu.
  adaptiveStream: false,
  dynacast: false,
  autoSubscribe: true,
  webAudioMix: false,
  audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
};
const micPublication = (Track) => ({ name: 'microphone', source: Track.Source.Microphone, dtx: false, red: false, forceStereo: false, audioPreset: { maxBitrate: 32000 }, stopMicTrackOnMute: false });
// Görüntü kalitesi: tek katman + yüksek bit hızı. Katman seçimi en düşük çözünürlükte kalıp
// karşı tarafta bulanık görüntüye yol açıyordu.
const CAMERA_PUBLICATION = {
  name: 'camera',
  simulcast: false,
  // Akıcılık korunur: bant darsa çözünürlük düşer, görüntü donmaz (kasma bundandı).
  degradationPreference: 'maintain-framerate',
  videoEncoding: { maxBitrate: 1_200_000, maxFramerate: 30 },
};
const CAMERA_RESOLUTION = { width: 1280, height: 720 };

// Kamera kaynağı geç serbest kalırsa ilk deneme boş döner: kısa bir arayla bir kez daha
// denenir. Böylece kullanıcı düğmeye iki kez basmak zorunda kalmıyor.
const createCameraTrack = async (engine, facingMode) => {
  try {
    return await engine.createLocalVideoTrack({ facingMode, resolution: CAMERA_RESOLUTION });
  } catch (error) {
    // İzin reddi tekrar denenmez; cihaz o yönü desteklemiyorsa kısıt düşürülerek denenir.
    if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') throw error;
    await new Promise((resolve) => setTimeout(resolve, 600));
    const loose = error?.name === 'OverconstrainedError' || error?.name === 'NotFoundError';
    return engine.createLocalVideoTrack({ ...(loose ? {} : { facingMode }), resolution: CAMERA_RESOLUTION });
  }
};

export default function DirectCallProvider({ children }) {
  const { user } = useCurrentUser();
  const [call, setCall] = useState(null);
  const [role, setRole] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [error, setError] = useState('');
  const [minimized, setMinimized] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [remoteCameraOn, setRemoteCameraOn] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState(null);
  const [facing, setFacing] = useState('user');

  const roomRef = useRef(null);
  const tokenRef = useRef(null);
  const publishedRef = useRef(null);
  const connectingRef = useRef(null);
  const publishingRef = useRef(null);
  const audioRef = useRef(new Set());
  const ringtoneRef = useRef(null);
  const timerRef = useRef(null);
  const userRef = useRef(null);
  const phaseRef = useRef('idle');
  const callRef = useRef(null);
  const roleRef = useRef(null);
  const mutedRef = useRef(false);
  const speakerRef = useRef(true);
  const micTrackRef = useRef(null);
  const publishedTrackRef = useRef(null);
  const cameraTrackRef = useRef(null);
  // Onay bekleyen görüntülü istekte kamera hazır tutulur, onay gelince yayına girer.
  const pendingCameraRef = useRef(null);
  const facingRef = useRef('user');

  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { callRef.current = call; }, [call]);
  useEffect(() => { roleRef.current = role; }, [role]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { speakerRef.current = speaker; }, [speaker]);

  const stopRingtone = useCallback(() => {
    ringtoneRef.current?.();
    ringtoneRef.current = null;
  }, []);

  const teardown = useCallback(() => {
    stopRingtone();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    audioRef.current.forEach((output) => output.remove());
    audioRef.current.clear();
    const room = roomRef.current;
    if (room) {
      room.removeAllListeners();
      // Mikrofon yayından çıkarılır ama durdurulmaz: oturum boyunca aynı izinle kullanılır.
      const micTrack = micTrackRef.current;
      if (micTrack) room.localParticipant.unpublishTrack(micTrack, false).catch(() => {});
      // Kamera yayından çıkarılır ve durdurulur: görüşme bitince ışığı söner.
      const cameraTrack = cameraTrackRef.current;
      if (cameraTrack) room.localParticipant.unpublishTrack(cameraTrack, true).catch(() => {});
      room.disconnect();
      roomRef.current = null;
    }
    tokenRef.current = null;
    connectingRef.current = null;
    publishingRef.current = null;
    callRef.current = null;
    publishedRef.current = null;
    publishedTrackRef.current = null;
    micTrackRef.current = null;
    cameraTrackRef.current?.stop();
    cameraTrackRef.current = null;
    // Onay bekleyen kamera da kapatılır: sonraki aramada ışık yanık kalmaz.
    pendingCameraRef.current?.stop();
    pendingCameraRef.current = null;
    setRemoteMuted(false);
    setCameraOn(false);
    facingRef.current = 'user';
    setFacing('user');
    setRemoteCameraOn(false);
    setLocalVideoTrack(null);
    setRemoteVideoTrack(null);
    // Mikrofon serbest bırakılır: sonraki arama temiz akışla başlar, izin tekrar sorulmaz.
    releaseMic();
    resetAudioRouting();
    releaseCallAudioFocus();
    setMinimized(false);
    phaseRef.current = 'idle';
    mutedRef.current = false;
    speakerRef.current = true;
    setCall(null);
    setRole(null);
    setPhase('idle');
    setSeconds(0);
    setMuted(false);
    setSpeaker(true);
    setError('');
  }, [stopRingtone]);

  // --- Ses çıkışları ---

  const attachRemoteAudio = useCallback((track) => {
    const kinds = callEngine?.Track?.Kind;
    if (!kinds || track.kind !== kinds.Audio) return;
    const existing = [...audioRef.current].find((output) => output.dataset.livekitTrack === track.sid);
    if (existing?.dataset.livekitMediaTrack === track.mediaStreamTrack?.id) return;
    if (existing) { existing.remove(); audioRef.current.delete(existing); }
    // Sesli odadaki çalışan yolun aynısı: ses doğrudan <audio> elementinden çalınır,
    // ahize/hoparlör yönlendirmesi iOS'ta navigator.audioSession, Android'de setSinkId ile yapılır.
    const output = createVoiceOutput(track, 'direct-call', { startMuted: phaseRef.current !== 'active' || !speakerRef.current });
    audioRef.current.add(output);
    Promise.all([output.play(), unlockVoicePlayback()]).catch(() => {
      if (phaseRef.current === 'active') setError('Karşı tarafı duymak için ekrana dokunun.');
    });
  }, []);

  // Karşı taraf kamerasını açtığında görüntü sahneye alınır.
  const attachRemoteVideo = useCallback((track) => {
    const kinds = callEngine?.Track?.Kind;
    if (!kinds || track.kind !== kinds.Video) return;
    setRemoteVideoTrack(track);
    setRemoteCameraOn(true);
  }, []);

  // Yeniden bağlanma ya da sonradan katılma sonrası açık kalmış kamera yayını sahneye alınır.
  const attachAllRemoteVideo = useCallback(() => {
    roomRef.current?.remoteParticipants.forEach((participant) => {
      participant.videoTrackPublications.forEach((publication) => {
        publication.setSubscribed(true);
        if (publication.track) attachRemoteVideo(publication.track);
      });
    });
  }, [attachRemoteVideo]);

  // Karşı tarafın mikrofonu kapalıysa oda yayınlarından damıtılır.
  const syncRemoteMute = useCallback(() => {
    let muted = false;
    roomRef.current?.remoteParticipants.forEach((participant) => {
      participant.audioTrackPublications.forEach((publication) => { if (publication.isMuted) muted = true; });
    });
    setRemoteMuted(muted);
  }, []);

  const attachAllRemoteAudio = useCallback(() => {
    roomRef.current?.remoteParticipants.forEach((participant) => {
      participant.audioTrackPublications.forEach((publication) => {
        publication.setSubscribed(true);
        if (publication.track) attachRemoteAudio(publication.track);
      });
    });
    syncRemoteMute();
  }, [attachRemoteAudio, syncRemoteMute]);

  const armOutputs = useCallback((active) => {
    audioRef.current.forEach((output) => {
      output.muted = !active || !speakerRef.current;
      if (active) output.play().catch(() => {});
    });
  }, []);

  // Karşı tarafın sesi odadaysa çağrı gerçekten cevaplanmıştır: arayan taraf, kayıt
  // güncellemesi gecikse bile "Bağlanıyor" ekranında kilitli kalmaz ve sesi duyar.
  // Zil çalarken karşı taraf yalnızca odaya katılır, mikrofonunu yayınlamaz.
  const markAnswered = useCallback(() => {
    if (phaseRef.current !== 'outgoing') return;
    let live = false;
    roomRef.current?.remoteParticipants.forEach((participant) => {
      participant.audioTrackPublications.forEach((publication) => { if (publication.track) live = true; });
    });
    if (!live) return;
    phaseRef.current = 'active';
    setPhase('active');
    armOutputs(true);
  }, [armOutputs]);

  // --- Bağlantı ---

  const watchMic = useCallback((room, track) => {
    let recovering = false;
    const recover = async () => {
      if (recovering || publishedRef.current !== room || micTrackRef.current !== track) return;
      recovering = true;
      try {
        const publication = room.localParticipant.getTrackPublication(callEngine?.Track?.Source?.Microphone);
        const next = await ensureMicTrack({ fresh: true });
        if (roomRef.current !== room || micTrackRef.current !== track) return;
        if (!next || next.readyState !== 'live' || !publication?.track) throw new Error('mikrofon yok');
        next.enabled = !mutedRef.current;
        await publication.track.replaceTrack(next, true);
        micTrackRef.current = next;
        watchMic(room, next);
        setError('');
      } catch (micError) {
        if (roomRef.current === room) setError(micError?.name === 'NotAllowedError' ? 'Mikrofon izni verilmedi.' : 'Mikrofon bağlantısı kesildi.');
      } finally { recovering = false; }
    };
    track.addEventListener('mute', recover);
    track.addEventListener('ended', recover);
    if (track.muted || track.readyState !== 'live') recover();
  }, []);

  const publishMic = useCallback(async (room) => {
    if (!room || roomRef.current !== room || publishedRef.current === room) return;
    if (publishingRef.current?.room === room) return publishingRef.current.promise;
    const task = { room, promise: null };
    publishingRef.current = task;
    task.promise = (async () => {
      try {
        // Dokunma anında alınmış canlı mikrofonu yeniden açmadan doğrudan yayınla.
        const micTrack = await ensureMicTrack();
        if (roomRef.current !== room) return;
        if (!micTrack || micTrack.readyState !== 'live') throw new Error('mikrofon yok');
        micTrackRef.current = micTrack;
        micTrack.enabled = !mutedRef.current;
        const engine = await loadCallEngine();
        if (roomRef.current !== room) return;
        // stopOnMute kapalı: sessize alma mikrofon akışını durdurmaz, ses geri açılabilir kalır.
        const localTrack = new engine.NativeCallTrack(micTrack, micTrack.getConstraints(), false);
        publishedTrackRef.current = localTrack;
        await room.localParticipant.publishTrack(localTrack, micPublication(engine.Track));
        // Karşı taraf katılmadan önce susturulduysa ses durumu sunucuya bildirilir.
        if (mutedRef.current) localTrack.mute().catch(() => {});
        if (roomRef.current !== room) return;
        publishedRef.current = room;
        watchMic(room, micTrack);
        setError('');
      } catch (micError) {
        if (roomRef.current === room) setError(micError?.name === 'NotAllowedError' ? 'Mikrofon izni verilmedi.' : 'Mikrofon başlatılamadı.');
      } finally {
        if (publishingRef.current === task) publishingRef.current = null;
      }
    })();
    return task.promise;
  }, [watchMic]);

  const connect = useCallback(async (callId, { publish = false } = {}) => {
    try {
      if (!connectingRef.current) {
        const task = { callId, promise: null };
        connectingRef.current = task;
        task.promise = (async () => {
          const me = userRef.current;
          const response = await base44.functions.invoke('livekitToken', { callId, participantName: me?.username || me?.full_name || 'Kullanıcı' });
          if (connectingRef.current !== task) return null;
          const data = response?.data;
          if (!data?.url || !data?.token) throw new Error('token yok');
          // Motor odaya girmeden önce indirilir: bağlantı akışı aynı kalır.
          const engine = await loadCallEngine();
          const room = new engine.NativeCallAudio(ROOM_OPTIONS);
          roomRef.current = room;
          room.on(engine.RoomEvent.TrackSubscribed, (track) => { attachRemoteAudio(track); attachRemoteVideo(track); markAnswered(); });
          room.on(engine.RoomEvent.ParticipantConnected, () => { attachAllRemoteAudio(); attachAllRemoteVideo(); markAnswered(); });
          room.on(engine.RoomEvent.TrackPublished, (publication) => {
            publication.setSubscribed(true);
            if (publication.kind === engine.Track.Kind.Audio && publication.track) attachRemoteAudio(publication.track);
            if (publication.kind === engine.Track.Kind.Video && publication.track) attachRemoteVideo(publication.track);
            markAnswered();
          });
          room.on(engine.RoomEvent.Reconnected, () => { attachAllRemoteAudio(); attachAllRemoteVideo(); markAnswered(); });
          // Karşı tarafın mikrofon durumu yayın bilgisi üzerinden yakalanır. Görüntüde
          // "susturulma" yok sayılır: kamera kapatılınca yayın tamamen kaldırılır ve sahne o an düşer.
          room.on(engine.RoomEvent.TrackMuted, (publication, participant) => {
            if (participant?.identity === room.localParticipant.identity) return;
            if (publication.kind === engine.Track.Kind.Audio) setRemoteMuted(true);
          });
          room.on(engine.RoomEvent.TrackUnmuted, (publication, participant) => {
            if (participant?.identity === room.localParticipant.identity) return;
            if (publication.kind === engine.Track.Kind.Audio) setRemoteMuted(false);
          });
          room.on(engine.RoomEvent.TrackUnsubscribed, (track) => {
            if (track.kind === engine.Track.Kind.Video) { setRemoteVideoTrack(null); setRemoteCameraOn(false); return; }
            audioRef.current.forEach((output) => {
              if (output.dataset.livekitTrack !== track.sid) return;
              audioRef.current.delete(output);
              output.remove();
            });
            syncRemoteMute();
          });
          await room.connect(data.url, data.token, { autoSubscribe: true });
          if (connectingRef.current !== task) { room.disconnect(); return null; }
          return room;
        })();
      }
      const task = connectingRef.current;
      if (task.callId !== callId) return;
      const room = await task.promise;
      if (!room || roomRef.current !== room) return;
      attachAllRemoteAudio();
      // Odaya girildiğinde karşı tarafın sesi zaten varsa görüşme doğrudan açılır.
      markAnswered();
      if (publish) await publishMic(room);
    } catch {
      if (callRef.current?.id === callId) setError('Ses bağlantısı kurulamadı.');
    }
  }, [attachAllRemoteAudio, attachAllRemoteVideo, attachRemoteAudio, attachRemoteVideo, markAnswered, publishMic]);

  // Zil çalarken ses kanalını ve mikrofonu hazırla — kabulde gecikme olmasın.
  const prepareSession = useCallback((callId) => {
    // Gelen çağrıda mikrofonu kullanıcı cevaplamadan açma.
    claimCallAudioFocus().then(() => {
      if (callRef.current?.id === callId) connect(callId, { publish: false });
    }).catch(() => setError('Mikrofon başka bir görüşmede kullanılıyor.'));
  }, [connect]);

  const beginLocalCall = useCallback((record, nextRole, nextPhase) => {
    setMinimized(false);
    callRef.current = record;
    roleRef.current = nextRole;
    setCall(record);
    setRole(nextRole);
    setPhase(nextPhase);
    phaseRef.current = nextPhase;
    setSeconds(0);
    setMuted(false);
    mutedRef.current = false;
  }, []);

  // Arama aktifleştiğinde: karşı tarafın sesi açılır, kendi mikrofonumuz yayına girer.
  const activateCall = useCallback((callId, isCallee) => {
    if (phaseRef.current !== 'active') {
      phaseRef.current = 'active';
      setPhase('active');
    }
    armOutputs(true);
    connect(callId, { publish: true });
  }, [armOutputs, connect, publishMic]);

  // caller: arama başlat — başarısızsa hata mesajı döner, null dönerse başarılı
  const startCall = useCallback(async ({ calleeId, conversationId }) => {
    if (phaseRef.current !== 'idle' || !userRef.current?.id || !calleeId) return 'Şu an arama başlatılamaz.';
    // Mikrofon iznini ağ yanıtından önce, doğrudan kullanıcı dokunuşunda başlat.
    try {
      await claimCallAudioFocus();
      await ensureMicTrack();
      unlockVoicePlayback();
      const response = await base44.functions.invoke('direct-call', { action: 'start', callee_id: calleeId, conversation_id: conversationId });
      const record = response.data?.call;
      if (!record) { releaseMic(); releaseCallAudioFocus(); return response.data?.error || 'Arama başlatılamadı.'; }
      beginLocalCall(record, 'caller', 'outgoing');
      ringtoneRef.current = startRingtone();
      await connect(record.id, { publish: true });
      return null;
    } catch (invokeError) {
      if (phaseRef.current === 'idle') { releaseMic(); releaseCallAudioFocus(); }
      return invokeError?.name === 'NotAllowedError' ? 'Mikrofon izni verilmedi.' : invokeError?.response?.data?.error || invokeError?.message || 'Arama başlatılamadı.';
    }
  }, [beginLocalCall, connect]);

  // callee: gelen aramayı kabul et — bağlantı zaten hazır, ses anında açılır
  const acceptCall = useCallback(async () => {
    const current = callRef.current;
    if (!current || phaseRef.current !== 'incoming') return;
    stopRingtone();
    // Safari için izin isteği cevaplama dokunuşunun içinde başlar.
    unlockVoicePlayback();
    claimCallAudioFocus().then(() => {
      if (callRef.current?.id === current.id) activateCall(current.id, true);
    }).catch(() => setError('Mikrofon başka bir görüşmede kullanılıyor.'));
    try {
      const response = await base44.functions.invoke('direct-call', { action: 'accept', call_id: current.id });
      const record = response.data?.call;
      // Sunucu aramayı yanıtlanmış saymadıysa görüşme açılmaz: karşı taraf "Bağlanıyor"
      // ekranında kilitli kalırken burada yanlış bir süre işlemesin.
      if (!record || record.status !== 'accepted') {
        setError(response.data?.error || 'Aramaya yanıt verilemedi.');
        teardown();
        return;
      }
      setCall(record);
    } catch {
      setError('Aramaya yanıt verilemedi.');
      teardown();
    }
  }, [activateCall, stopRingtone, teardown]);

  const rejectCall = useCallback(() => {
    const current = callRef.current;
    stopRingtone();
    if (current) base44.functions.invoke('direct-call', { action: 'reject', call_id: current.id }).catch(() => {});
    teardown();
  }, [stopRingtone, teardown]);

  const endCall = useCallback(() => {
    const current = callRef.current;
    if (current) {
      const action = roleRef.current === 'caller' && current.status === 'ringing' ? 'cancel' : 'end';
      base44.functions.invoke('direct-call', { action, call_id: current.id }).catch(() => {});
    }
    teardown();
  }, [teardown]);

  // Sessize alma mikrofon akışını kapatmaz; yayın üzerinden susturulur ki
  // karşı taraf "sessize alındı" bilgisini alır ve izin yeniden istenmez.
  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    const publishedTrack = publishedTrackRef.current;
    if (publishedTrack) {
      (next ? publishedTrack.mute() : publishedTrack.unmute()).catch(() => {});
      return;
    }
    const track = micTrackRef.current;
    if (track && track.readyState === 'live') track.enabled = !next;
  }, []);

  // Hoparlör tuşu yalnız karşı tarafın sesini keser; mikrofon yayını devam eder.
  const toggleSpeaker = useCallback(() => {
    const next = !speakerRef.current;
    speakerRef.current = next;
    setSpeaker(next);
    // Hoparlör/ahize yönlendirmesi gerçekten değiştirilir; ses kesme davranışı korunur.
    setSpeakerMode(next).catch(() => {});
    audioRef.current.forEach((output) => {
      output.muted = !next || phaseRef.current !== 'active';
      if (next) output.play().catch(() => {});
    });
  }, []);

  // --- Görüntülü görüşme ---

  // Aynalama gerçek kameraya göre belirlenir. Tarayıcı "arka kamera" isteğini yok sayıp ön
  // kamerayı açık bırakırsa ayna kapanıyor ve kişi kendini ters görüyordu.
  const syncFacing = useCallback((track) => {
    const mode = track?.mediaStreamTrack?.getSettings?.().facingMode;
    const next = mode === 'environment' ? 'environment' : 'user';
    facingRef.current = next;
    setFacing(next);
  }, []);

  // Kamera izni her zaman kullanıcı dokunuşunun içinde istenir: iOS'ta izin isteği bir
  // beklemenin ardından yapılırsa tarayıcı kamerayı hiç açmıyordu.
  // 720p: düşük çözünürlük karşı tarafta bulanık görünüyordu.
  const acquireCamera = useCallback(async () => {
    const engine = callEngine || (await loadCallEngine());
    const track = await createCameraTrack(engine, facingRef.current);
    syncFacing(track);
    return track;
  }, [syncFacing]);

  // Kamera yayına girer: karşı taraf açmasa bile bizi görür.
  const publishCamera = useCallback(async (track) => {
    const room = roomRef.current;
    if (!room || !track) { track?.stop(); return; }
    cameraTrackRef.current = track;
    setLocalVideoTrack(track);
    setCameraOn(true);
    try {
      await room.localParticipant.publishTrack(track, { ...CAMERA_PUBLICATION, source: callEngine.Track.Source.Camera });
      setError('');
    } catch {
      cameraTrackRef.current = null;
      setLocalVideoTrack(null);
      setCameraOn(false);
      track.stop();
      setError('Kamera yayına alınamadı.');
    }
  }, []);

  const stopCamera = useCallback(async () => {
    const room = roomRef.current;
    const track = cameraTrackRef.current;
    if (!track) return;
    cameraTrackRef.current = null;
    setLocalVideoTrack(null);
    setCameraOn(false);
    if (room) await room.localParticipant.unpublishTrack(track, true).catch(() => {});
    else track.stop();
  }, []);

  // Kamerayı aç/kapat. Ücret bu aramada bir kez ödendiği için kapatıp açmak coin istemez.
  const toggleCamera = useCallback(async () => {
    if (cameraTrackRef.current) { await stopCamera(); return; }
    try {
      const track = await acquireCamera();
      if (!roomRef.current) { track.stop(); return; }
      await publishCamera(track);
    } catch (cameraError) {
      setError(cameraError?.name === 'NotAllowedError' ? 'Kamera izni verilmedi.' : 'Kamera açılamadı.');
    }
  }, [acquireCamera, publishCamera, stopCamera]);

  // Görüntülü görüşme isteği. Ücret yalnızca erkek → kadın görüşmede alınır ve karşı taraf
  // onayladığında tahsil edilir; onaylanmazsa isteyenden hiç coin kesilmez.
  const startVideo = useCallback(async () => {
    const current = callRef.current;
    if (!current || !roomRef.current || cameraTrackRef.current || pendingCameraRef.current) return;
    let track = null;
    try {
      track = await acquireCamera();
    } catch (cameraError) {
      setError(cameraError?.name === 'NotAllowedError' ? 'Kamera izni verilmedi.' : 'Kamera açılamadı.');
      return;
    }
    try {
      const response = await base44.functions.invoke('direct-call', { action: 'video-request', call_id: current.id });
      const data = response.data || {};
      if (data.call) setCall(data.call);
      if (data.status === 'accepted') { await publishCamera(track); return; }
      if (data.status === 'pending') { pendingCameraRef.current = track; return; }
      track.stop();
      setError('Görüntülü istek gönderilemedi.');
    } catch (requestError) {
      track.stop();
      setError(requestError?.response?.data?.error || 'Görüntülü görüşme başlatılamadı.');
    }
  }, [acquireCamera, publishCamera]);

  // Karşı taraftan gelen görüntülü isteği yanıtla: reddedilirse ücret alınmaz.
  const answerVideo = useCallback(async (accept) => {
    const current = callRef.current;
    if (!current) return;
    if (!accept) {
      pendingCameraRef.current?.stop();
      pendingCameraRef.current = null;
      await base44.functions.invoke('direct-call', { action: 'video-respond', call_id: current.id, accept: false }).catch(() => {});
      return;
    }
    // Onayda kamera izni de dokunma anında alınır.
    let track = null;
    try { track = await acquireCamera(); } catch { track = null; }
    try {
      const response = await base44.functions.invoke('direct-call', { action: 'video-respond', call_id: current.id, accept: true });
      if (response.data?.call) setCall(response.data.call);
      if (track) await publishCamera(track);
    } catch (answerError) {
      track?.stop();
      setError(answerError?.response?.data?.error || 'Görüntülü görüşme başlatılamadı.');
    }
  }, [acquireCamera, publishCamera]);

  // Bekleyen isteği geri çek: kamera kapanır, karşı tarafa bildirilir, ücret alınmaz.
  const cancelVideo = useCallback(async () => {
    const current = callRef.current;
    pendingCameraRef.current?.stop();
    pendingCameraRef.current = null;
    if (current) await base44.functions.invoke('direct-call', { action: 'video-respond', call_id: current.id, accept: false }).catch(() => {});
  }, []);

  // Ön/arka kamera geçişi: yeni kamera yayına alınır, eski kamera kapatılır.
  const switchCamera = useCallback(async () => {
    const room = roomRef.current;
    const current = cameraTrackRef.current;
    if (!room || !current) return;
    const next = facingRef.current === 'user' ? 'environment' : 'user';
    try {
      const engine = callEngine || (await loadCallEngine());
      const track = await createCameraTrack(engine, next);
      if (roomRef.current !== room) { track.stop(); return; }
      cameraTrackRef.current = track;
      // Aynalama açılan gerçek kameraya göre ayarlanır, istenen yöne göre değil.
      syncFacing(track);
      setLocalVideoTrack(track);
      await room.localParticipant.unpublishTrack(current, true).catch(() => {});
      await room.localParticipant.publishTrack(track, { ...CAMERA_PUBLICATION, source: engine.Track.Source.Camera });
      setError('');
    } catch (cameraError) {
      setError(cameraError?.name === 'NotAllowedError' ? 'Kamera izni verilmedi.' : 'Kamera değiştirilemedi.');
    }
  }, [syncFacing]);

  // Canlı denetim: kamera açıkken kareler kontrol edilir, ihlalde arama anında kapanır.
  const moderation = useCallModeration({
    callId: call?.id,
    active: phase === 'active' && cameraOn,
    track: localVideoTrack,
    onViolation: teardown,
  });

  // Gelen/biten arama senkronizasyonu — gerçek zamanlı abonelik + yedek sorgu
  useEffect(() => {
    const myId = user?.id;
    if (!myId) return;

    // Aynı aramanın gecikmiş eski bir kopyası durumu geriye sarmasın: kayıt zamanı izlenir.
    const applied = { id: '', at: 0 };

    const applyRecord = (record, type) => {
      if (!record) return;
      const involved = record.caller_id === myId || record.callee_id === myId;
      if (!involved) return;
      const at = new Date(record.updated_date || record.created_date || 0).getTime() || 0;
      if (applied.id === record.id && applied.at > at) return;
      if (applied.id !== record.id) { applied.id = record.id; applied.at = 0; }
      applied.at = Math.max(applied.at, at);

      if (type === 'create') {
        if (record.callee_id === myId && record.status === 'ringing' && phaseRef.current === 'idle') {
          beginLocalCall(record, 'callee', 'incoming');
          stopRingtone();
          // Rahatsız etme açıkken gelen arama sessiz bildirilir
          if (!record.silent) ringtoneRef.current = startRingtone();
          prepareSession(record.id);
        }
        return;
      }

      const current = callRef.current;
      if (!current || current.id !== record.id) return;

      // Görüntülü isteğin sonucu: onaylandıysa bekleyen kamera yayına girer, reddedilirse kapanır.
      if (record.video_fee_status === 'accepted' && pendingCameraRef.current) {
        const pendingTrack = pendingCameraRef.current;
        pendingCameraRef.current = null;
        publishCamera(pendingTrack);
      } else if (record.video_fee_status === 'rejected' && pendingCameraRef.current) {
        pendingCameraRef.current.stop();
        pendingCameraRef.current = null;
      }

      if (record.status === 'ringing') {
        if (current.status !== 'ringing') setCall(record);
        return;
      }
      if (record.status === 'accepted') {
        stopRingtone();
        setCall(record);
        activateCall(record.id, record.callee_id === myId);
        return;
      }
      if (ENDED_STATUSES.includes(record.status)) teardown();
    };

    const unsubscribe = subscribeEntity('DirectCall', (event) => {
      applyRecord(event?.data, event?.type);
    });

    const syncActive = async () => {
      if (phaseRef.current !== 'idle') return;
      try {
        const response = await base44.functions.invoke('direct-call', { action: 'active' });
        if (response.data?.call) applyRecord(response.data.call, 'create');
      } catch {}
    };
    syncActive();

    // Arama sürerken kayıt 5 saniyede bir tazelenir: canlı akış gecikse de (mobil/PWA)
    // görüntülü isteğin sonucu ve karşı tarafın kamerası kendiliğinden yerine oturur.
    const refreshCall = async () => {
      const current = callRef.current;
      if (!current || document.visibilityState === 'hidden') return;
      try {
        const response = await base44.functions.invoke('direct-call', { action: 'get', call_id: current.id });
        if (response.data?.call) applyRecord(response.data.call, 'update');
      } catch {}
      // Olay kaçırıldıysa açık kalan karşı taraf kamerası sahneye alınır.
      attachAllRemoteVideo();
    };

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (phaseRef.current === 'idle') syncActive(); else refreshCall();
    };
    document.addEventListener('visibilitychange', onVisible);
    // Yedek yoklama 15sn'de bir; sekme arkadayken çağrılmaz.
    const poll = setInterval(() => {
      if (phaseRef.current === 'idle' && document.visibilityState !== 'hidden') syncActive();
    }, 15000);
    const live = setInterval(() => { if (phaseRef.current !== 'idle') refreshCall(); }, 5000);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(poll);
      clearInterval(live);
    };
  }, [user?.id, activateCall, attachAllRemoteVideo, beginLocalCall, prepareSession, publishCamera, stopRingtone, teardown]);

  // Cevapsız aramayı otomatik iptal et
  useEffect(() => {
    if (phase !== 'outgoing') return;
    const timeout = setTimeout(() => {
      if (phaseRef.current !== 'outgoing') return;
      const current = callRef.current;
      if (current) base44.functions.invoke('direct-call', { action: 'cancel', call_id: current.id }).catch(() => {});
      teardown();
    }, CALL_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [phase, teardown]);

  // Görüşme süresi
  useEffect(() => {
    if (phase !== 'active') return;
    const base = call?.accepted_at ? new Date(call.accepted_at).getTime() : Date.now();
    const tick = () => setSeconds(Math.max(0, Math.floor((Date.now() - base) / 1000)));
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { clearInterval(timerRef.current); timerRef.current = null; };
  }, [phase, call?.accepted_at]);

  useEffect(() => () => teardown(), [teardown]);

  const value = useMemo(() => ({
    call, role, phase, seconds, muted, speaker, error, minimized, remoteMuted,
    cameraOn, remoteCameraOn, localVideoTrack, remoteVideoTrack, facing,
    moderationNotice: moderation.notice,
    startCall, acceptCall, rejectCall, endCall, toggleMute, toggleSpeaker, toggleCamera, switchCamera,
    startVideo, answerVideo, cancelVideo,
    clearModerationNotice: moderation.clearNotice,
    minimizeCall: () => setMinimized(true),
    restoreCall: () => { setMinimized(false); armOutputs(phaseRef.current === 'active'); },
    clearError: () => setError(''),
  }), [call, role, phase, seconds, muted, speaker, error, minimized, remoteMuted, cameraOn, remoteCameraOn, localVideoTrack, remoteVideoTrack, facing, moderation.notice, moderation.clearNotice, armOutputs, startCall, acceptCall, rejectCall, endCall, toggleMute, toggleSpeaker, toggleCamera, switchCamera, startVideo, answerVideo, cancelVideo]);

  return <DirectCallContext.Provider value={value}>{children}</DirectCallContext.Provider>;
}