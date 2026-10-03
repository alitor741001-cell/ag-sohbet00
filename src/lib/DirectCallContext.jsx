import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { base44 } from '@/api/base44Client';
import { createVoiceOutput, ensureMicTrack, releaseMic, resetAudioRouting, setSpeakerMode, startRingtone } from '@/lib/callAudio';
import { useCurrentUser } from '@/lib/useCurrentUser';

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
const MIC_PUBLICATION = { name: 'microphone', source: Track.Source.Microphone, dtx: false, stopMicTrackOnMute: false };

export default function DirectCallProvider({ children }) {
  const { user } = useCurrentUser();
  const [call, setCall] = useState(null);
  const [role, setRole] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [error, setError] = useState('');

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
      room.disconnect();
      roomRef.current = null;
    }
    tokenRef.current = null;
    connectingRef.current = null;
    publishingRef.current = null;
    callRef.current = null;
    publishedRef.current = null;
    micTrackRef.current = null;
    // Mikrofon serbest bırakılır: sonraki arama temiz akışla başlar, izin tekrar sorulmaz.
    releaseMic();
    resetAudioRouting();
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
    if (track.kind !== Track.Kind.Audio) return;
    if ([...audioRef.current].some((output) => output.dataset.livekitTrack === track.sid)) return;
    // Karşı taraf kabul edene kadar sessiz tutulur; kabulde anında açılır.
    const output = createVoiceOutput(track, 'direct-call', { startMuted: phaseRef.current !== 'active' });
    audioRef.current.add(output);
    roomRef.current?.startAudio?.().catch(() => {});
    output.play().catch(() => {});
  }, []);

  const attachAllRemoteAudio = useCallback(() => {
    roomRef.current?.remoteParticipants.forEach((participant) => {
      participant.audioTrackPublications.forEach((publication) => {
        publication.setSubscribed(true);
        if (publication.track) attachRemoteAudio(publication.track);
      });
    });
  }, [attachRemoteAudio]);

  const armOutputs = useCallback((active) => {
    audioRef.current.forEach((output) => {
      output.muted = !active;
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
        const publication = room.localParticipant.getTrackPublication(Track.Source.Microphone);
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
        await room.localParticipant.publishTrack(micTrack, MIC_PUBLICATION);
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
          const room = new Room(ROOM_OPTIONS);
          roomRef.current = room;
          room.on(RoomEvent.TrackSubscribed, attachRemoteAudio);
          room.on(RoomEvent.ParticipantConnected, attachAllRemoteAudio);
          room.on(RoomEvent.TrackPublished, (publication) => {
            if (publication.kind === Track.Kind.Audio) {
              publication.setSubscribed(true);
              if (publication.track) attachRemoteAudio(publication.track);
            }
          });
          room.on(RoomEvent.Reconnected, attachAllRemoteAudio);
          room.on(RoomEvent.TrackUnsubscribed, (track) => {
            audioRef.current.forEach((output) => {
              if (output.dataset.livekitTrack !== track.sid) return;
              audioRef.current.delete(output);
              output.remove();
            });
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
  }, [attachAllRemoteAudio, attachRemoteAudio, publishMic]);

  // Zil çalarken ses kanalını ve mikrofonu hazırla — kabulde gecikme olmasın.
  const prepareSession = useCallback((callId) => {
    // Gelen çağrıda mikrofonu kullanıcı cevaplamadan açma.
    connect(callId, { publish: false });
  }, [connect]);

  const beginLocalCall = useCallback((record, nextRole, nextPhase) => {
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
    if (isCallee) connect(callId, { publish: true });
  }, [armOutputs, connect, publishMic]);

  // caller: arama başlat — başarısızsa hata mesajı döner, null dönerse başarılı
  const startCall = useCallback(async ({ calleeId, conversationId }) => {
    if (phaseRef.current !== 'idle' || !userRef.current?.id || !calleeId) return 'Şu an arama başlatılamaz.';
    // Mikrofon iznini ağ yanıtından önce, doğrudan kullanıcı dokunuşunda başlat.
    const microphone = ensureMicTrack();
    microphone.catch(() => {});
    try {
      await microphone;
      const response = await base44.functions.invoke('direct-call', { action: 'start', callee_id: calleeId, conversation_id: conversationId });
      const record = response.data?.call;
      if (!record) { releaseMic(); return response.data?.error || 'Arama başlatılamadı.'; }
      beginLocalCall(record, 'caller', 'outgoing');
      ringtoneRef.current = startRingtone();
      await connect(record.id, { publish: true });
      return null;
    } catch (invokeError) {
      if (phaseRef.current === 'idle') releaseMic();
      return invokeError?.name === 'NotAllowedError' ? 'Mikrofon izni verilmedi.' : invokeError?.response?.data?.error || invokeError?.message || 'Arama başlatılamadı.';
    }
  }, [beginLocalCall, connect]);

  // callee: gelen aramayı kabul et — bağlantı zaten hazır, ses anında açılır
  const acceptCall = useCallback(async () => {
    const current = callRef.current;
    if (!current || phaseRef.current !== 'incoming') return;
    stopRingtone();
    // Safari için izin isteği cevaplama dokunuşunun içinde başlar.
    ensureMicTrack().catch((micError) => setError(micError?.name === 'NotAllowedError' ? 'Mikrofon izni verilmedi.' : 'Mikrofon başlatılamadı.'));
    activateCall(current.id, true);
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

  // Sessize alma yayını kapatmaz, track'i duraklatır: izin yeniden istenmez,
  // tuş anında tepki verir ve mikrofon akışı kopmaz.
  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    const track = micTrackRef.current;
    if (track && track.readyState === 'live') track.enabled = !next;
  }, []);

  // Hoparlör açıkken tam ses, kapalıyken çıkış ahizeye yönlendirilir.
  const toggleSpeaker = useCallback(() => {
    const next = !speakerRef.current;
    speakerRef.current = next;
    setSpeaker(next);
    setSpeakerMode(next);
  }, []);

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

    const unsubscribe = base44.entities.DirectCall.subscribe((event) => {
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
    const poll = setInterval(() => { if (phaseRef.current === 'idle') syncActive(); }, 8000);

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
    call, role, phase, seconds, muted, speaker, error,
    startCall, acceptCall, rejectCall, endCall, toggleMute, toggleSpeaker,
    clearError: () => setError(''),
  }), [call, role, phase, seconds, muted, speaker, error, startCall, acceptCall, rejectCall, endCall, toggleMute, toggleSpeaker]);

  return <DirectCallContext.Provider value={value}>{children}</DirectCallContext.Provider>;
}