import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { claimCallAudioFocus, releaseCallAudioFocus } from '@/lib/callAudioFocus';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { createVoiceOutput, ensureMicTrack, releaseMic, resetAudioRouting, startRingtone, unlockVoicePlayback } from '@/lib/callAudio';
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
  adaptiveStream: true,
  dynacast: true,
  autoSubscribe: true,
  webAudioMix: false,
  audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
};
const micPublication = (Track) => ({ name: 'microphone', source: Track.Source.Microphone, dtx: false, red: false, forceStereo: false, audioPreset: { maxBitrate: 32000 }, stopMicTrackOnMute: false });

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
    const output = createVoiceOutput(track, 'direct-call', { startMuted: phaseRef.current !== 'active' || !speakerRef.current, nativeOnly: true });
    audioRef.current.add(output);
    output.play().catch(() => { if (phaseRef.current === 'active') setError('Karşı tarafı duymak için ekrana dokunun.'); });
  }, []);

  // Karşı taraf kamerasını açtığında görüntü sahneye alınır.
  const attachRemoteVideo = useCallback((track) => {
    const kinds = callEngine?.Track?.Kind;
    if (!kinds || track.kind !== kinds.Video) return;
    setRemoteVideoTrack(track);
    setRemoteCameraOn(true);
  }, []);

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
        const localTrack = new engine.NativeCallTrack(micTrack, micTrack.getConstraints(), true);
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
          room.on(engine.RoomEvent.TrackSubscribed, (track) => { attachRemoteAudio(track); attachRemoteVideo(track); });
          room.on(engine.RoomEvent.ParticipantConnected, attachAllRemoteAudio);
          room.on(engine.RoomEvent.TrackPublished, (publication) => {
            publication.setSubscribed(true);
            if (publication.kind === engine.Track.Kind.Audio && publication.track) attachRemoteAudio(publication.track);
            if (publication.kind === engine.Track.Kind.Video && publication.track) attachRemoteVideo(publication.track);
          });
          room.on(engine.RoomEvent.Reconnected, attachAllRemoteAudio);
          // Karşı tarafın mikrofon/kamera durumu yayın bilgisi üzerinden yakalanır.
          room.on(engine.RoomEvent.TrackMuted, (publication, participant) => {
            if (participant?.identity === room.localParticipant.identity) return;
            if (publication.kind === engine.Track.Kind.Video) { setRemoteCameraOn(false); return; }
            if (publication.kind === engine.Track.Kind.Audio) setRemoteMuted(true);
          });
          room.on(engine.RoomEvent.TrackUnmuted, (publication, participant) => {
            if (participant?.identity === room.localParticipant.identity) return;
            if (publication.kind === engine.Track.Kind.Video) { setRemoteCameraOn(true); return; }
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
      if (publish) await publishMic(room);
    } catch {
      if (callRef.current?.id === callId) setError('Ses bağlantısı kurulamadı.');
    }
  }, [attachAllRemoteAudio, attachRemoteAudio, attachRemoteVideo, publishMic]);

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
      setCall(response.data?.call || { ...current, status: 'accepted', accepted_at: new Date().toISOString() });
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
    audioRef.current.forEach((output) => {
      output.muted = !next || phaseRef.current !== 'active';
      if (next) output.play().catch(() => {});
    });
  }, []);

  // Görüntülü görüşme: kameramız yayına girer, karşı taraf açmasa bile bizi görür.
  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    if (cameraTrackRef.current) {
      const track = cameraTrackRef.current;
      cameraTrackRef.current = null;
      setLocalVideoTrack(null);
      setCameraOn(false);
      await room.localParticipant.unpublishTrack(track, true).catch(() => {});
      return;
    }
    try {
      const engine = callEngine || (await loadCallEngine());
      const track = await engine.createLocalVideoTrack({ facingMode: facingRef.current, resolution: { width: 640, height: 360 } });
      if (roomRef.current !== room) { track.stop(); return; }
      cameraTrackRef.current = track;
      setLocalVideoTrack(track);
      setCameraOn(true);
      await room.localParticipant.publishTrack(track, { name: 'camera', source: engine.Track.Source.Camera });
      setError('');
    } catch (cameraError) {
      cameraTrackRef.current = null;
      setLocalVideoTrack(null);
      setCameraOn(false);
      setError(cameraError?.name === 'NotAllowedError' ? 'Kamera izni verilmedi.' : 'Kamera açılamadı.');
    }
  }, []);

  // Ön/arka kamera geçişi: yeni kamera yayına alınır, eski kamera kapatılır.
  const switchCamera = useCallback(async () => {
    const room = roomRef.current;
    const current = cameraTrackRef.current;
    if (!room || !current) return;
    const next = facingRef.current === 'user' ? 'environment' : 'user';
    try {
      const engine = callEngine || (await loadCallEngine());
      const track = await engine.createLocalVideoTrack({ facingMode: next, resolution: { width: 640, height: 360 } });
      if (roomRef.current !== room) { track.stop(); return; }
      cameraTrackRef.current = track;
      facingRef.current = next;
      setFacing(next);
      setLocalVideoTrack(track);
      await room.localParticipant.unpublishTrack(current, true).catch(() => {});
      await room.localParticipant.publishTrack(track, { name: 'camera', source: engine.Track.Source.Camera });
      setError('');
    } catch (cameraError) {
      setError(cameraError?.name === 'NotAllowedError' ? 'Kamera izni verilmedi.' : 'Kamera değiştirilemedi.');
    }
  }, []);

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

    const applyRecord = (record, type) => {
      if (!record) return;
      const involved = record.caller_id === myId || record.callee_id === myId;
      if (!involved) return;

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

    const onVisible = () => { if (document.visibilityState === 'visible') syncActive(); };
    document.addEventListener('visibilitychange', onVisible);
    // Yedek yoklama 15sn'de bir; sekme arkadayken çağrılmaz.
    const poll = setInterval(() => {
      if (phaseRef.current === 'idle' && document.visibilityState !== 'hidden') syncActive();
    }, 15000);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(poll);
    };
  }, [user?.id, activateCall, beginLocalCall, prepareSession, stopRingtone, teardown]);

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
    clearModerationNotice: moderation.clearNotice,
    minimizeCall: () => setMinimized(true),
    restoreCall: () => { setMinimized(false); armOutputs(phaseRef.current === 'active'); },
    clearError: () => setError(''),
  }), [call, role, phase, seconds, muted, speaker, error, minimized, remoteMuted, cameraOn, remoteCameraOn, localVideoTrack, remoteVideoTrack, facing, moderation.notice, moderation.clearNotice, armOutputs, startCall, acceptCall, rejectCall, endCall, toggleMute, toggleSpeaker, toggleCamera, switchCamera]);

  return <DirectCallContext.Provider value={value}>{children}</DirectCallContext.Provider>;
}