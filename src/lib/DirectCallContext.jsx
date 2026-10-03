import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { base44 } from '@/api/base44Client';
import { createVoiceOutput, startRingtone, unlockVoicePlayback } from '@/lib/voicePlayback';
import { ensureMicTrack } from '@/lib/micStream';
import { useCurrentUser } from '@/lib/useCurrentUser';

const DirectCallContext = createContext(null);
export const useDirectCall = () => useContext(DirectCallContext);

const ENDED_STATUSES = ['rejected', 'ended', 'cancelled', 'missed'];
const CALL_TIMEOUT_MS = 45000;

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
    audioRef.current.forEach((element) => element.remove());
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

  const attachRemoteAudio = useCallback((track) => {
    if (track.kind !== Track.Kind.Audio) return;
    if ([...audioRef.current].some((element) => element.dataset.livekitTrack === track.sid)) return;
    const element = createVoiceOutput(track, 'direct-call');
    element.setSpeaker?.(speakerRef.current);
    audioRef.current.add(element);
    Promise.all([roomRef.current?.startAudio(), element.play(), unlockVoicePlayback()]).catch(() => {});
  }, []);

  const attachAllRemoteAudio = useCallback(() => {
    roomRef.current?.remoteParticipants.forEach((participant) => {
      participant.audioTrackPublications.forEach((publication) => {
        publication.setSubscribed(true);
        if (publication.track) attachRemoteAudio(publication.track);
      });
    });
  }, [attachRemoteAudio]);

  const connect = useCallback(async (callId, publish) => {
    const me = userRef.current;
    const displayName = me?.username || me?.full_name || 'Kullanıcı';
    try {
      const response = await base44.functions.invoke('livekitToken', { callId, participantName: displayName });
      const room = new Room({ adaptiveStream: true, dynacast: true, autoSubscribe: true });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, attachRemoteAudio);
      room.on(RoomEvent.ParticipantConnected, attachAllRemoteAudio);
      room.on(RoomEvent.TrackPublished, (publication) => {
        if (publication.kind === Track.Kind.Audio) {
          publication.setSubscribed(true);
          if (publication.track) attachRemoteAudio(publication.track);
        }
      });
      room.on(RoomEvent.Reconnected, () => { attachAllRemoteAudio(); room.startAudio().catch(() => {}); });
      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        audioRef.current.forEach((element) => {
          if (element.dataset.livekitTrack !== track.sid) return;
          audioRef.current.delete(element);
          element.remove();
        });
      });

      await room.connect(response.data.url, response.data.token, { autoSubscribe: true });
      await room.startAudio().catch(() => {});
      attachAllRemoteAudio();
      if (publish) {
        try {
          // Oturumdaki tek mikrofon akışı: ilk aramada izin bir kez istenir.
          const micTrack = await ensureMicTrack();
          if (!micTrack) throw new Error('mikrofon yok');
          micTrackRef.current = micTrack;
          await room.localParticipant.publishTrack(micTrack, { name: 'microphone', source: Track.Source.Microphone });
          micTrack.enabled = !mutedRef.current;
        } catch (micError) {
          setError(micError?.name === 'NotAllowedError' ? '🎤 Mikrofon izni verilmedi.' : '🎤 Mikrofon başlatılamadı.');
        }
      }
    } catch {
      setError('🌐 Ses bağlantısı kurulamadı.');
    }
  }, [attachAllRemoteAudio, attachRemoteAudio]);

  const beginLocalCall = useCallback((record, nextRole, nextPhase) => {
    setCall(record);
    setRole(nextRole);
    setPhase(nextPhase);
    setSeconds(0);
    setMuted(false);
  }, []);

  // caller: arama başlat — başarısızsa hata mesajı döner, null dönerse başarılı
  const startCall = useCallback(async ({ calleeId, conversationId }) => {
    if (phaseRef.current !== 'idle' || !userRef.current?.id || !calleeId) return 'Şu an arama başlatılamaz.';
    try {
      const response = await base44.functions.invoke('direct-call', { action: 'start', callee_id: calleeId, conversation_id: conversationId });
      const record = response.data?.call;
      if (!record) return response.data?.error || 'Arama başlatılamadı.';
      beginLocalCall(record, 'caller', 'outgoing');
      ringtoneRef.current = startRingtone({ freq: 420 });
      await connect(record.id, true);
      return null;
    } catch (invokeError) {
      return invokeError?.response?.data?.error || invokeError?.message || 'Arama başlatılamadı.';
    }
  }, [beginLocalCall, connect]);

  const acceptCall = useCallback(async () => {
    const current = callRef.current;
    if (!current || phaseRef.current !== 'incoming') return;
    stopRingtone();
    setPhase('active');
    try {
      const response = await base44.functions.invoke('direct-call', { action: 'accept', call_id: current.id });
      const record = response.data?.call || { ...current, status: 'accepted', accepted_at: new Date().toISOString() };
      setCall(record);
      await connect(record.id, true);
    } catch {
      setError('Aramaya yanıt verilemedi.');
      teardown();
    }
  }, [connect, stopRingtone, teardown]);

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

  // Hoparlör açıkken tam ses, kapalıyken çıkış ahize seviyesine alınır.
  const toggleSpeaker = useCallback(() => {
    const next = !speakerRef.current;
    speakerRef.current = next;
    setSpeaker(next);
    audioRef.current.forEach((element) => element.setSpeaker?.(next));
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
          if (!record.silent) ringtoneRef.current = startRingtone({ freq: 880 });
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
        if (phaseRef.current === 'incoming' || current.status !== 'accepted') {
          stopRingtone();
          setCall(record);
          setPhase('active');
          if (record.callee_id === myId && !roomRef.current) connect(record.id, true);
        }
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
  }, [user?.id, beginLocalCall, connect, stopRingtone, teardown]);

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