import { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { base44 } from '@/api/base44Client';
import { createVoiceOutput, unlockVoicePlayback } from '@/lib/callAudio';
import { hasDirectCallAudioFocus, subscribeCallAudioFocus } from '@/lib/callAudioFocus';

const initialDebug = { participantCount: 0, remoteParticipants: 0, remoteTracks: 0, playback: 'hazır' };
const NOISE_KEY = 'voice-noise-suppression';
// Gürültü engelleme tercihi cihazda saklanır (varsayılan: açık).
const readNoiseSuppression = () => {
  try { return localStorage.getItem(NOISE_KEY) !== 'off'; } catch { return true; }
};
const friendlyMicError = (error) => {
  if (error?.name === 'NotAllowedError') return '🎤 Mikrofon izni verilmedi.';
  if (error?.name === 'NotReadableError') return '🎤 Mikrofon kullanılamıyor.';
  return '🎤 Mikrofon başlatılamadı.';
};

export function useVoiceChat({ roomId, user, participants, voiceEnabled, micEnabled }) {
  const roomRef = useRef(null);
  const [callAudioPaused, setCallAudioPaused] = useState(hasDirectCallAudioFocus);
  useEffect(() => subscribeCallAudioFocus((paused) => {
    setCallAudioPaused(paused);
    if (paused) return roomRef.current?.disconnect(true);
  }), []);
  const audioElementsRef = useRef(new Set());
  const mutedByModeratorRef = useRef(false);
  const deafenedRef = useRef(false);
  const remoteAudioControlRef = useRef(null);
  const [active, setActive] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [noiseSuppression, setNoiseSuppression] = useState(readNoiseSuppression);
  const noiseSuppressionRef = useRef(noiseSuppression);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [speakingIds, setSpeakingIds] = useState([]);
  const [participantMicStates, setParticipantMicStates] = useState({});
  const [connectionState, setConnectionState] = useState('disconnected');
  const [error, setError] = useState('');
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [debug, setDebug] = useState(initialDebug);
  const [everVoiceEnabled, setEverVoiceEnabled] = useState(voiceEnabled);
  const voiceEnabledRef = useRef(voiceEnabled);
  // Koltuk düzeni: mikrofon yayını yalnızca koltukta oturan kişide açık kalır.
  const micEnabledRef = useRef(micEnabled !== false);
  const micAppliedRef = useRef(micEnabled !== false);
  useEffect(() => { voiceEnabledRef.current = voiceEnabled; if (voiceEnabled) setEverVoiceEnabled(true); }, [voiceEnabled]);
  useEffect(() => { micEnabledRef.current = micEnabled !== false; }, [micEnabled]);

  const refreshState = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    const people = [room.localParticipant, ...room.remoteParticipants.values()];
    const micStates = {};
    people.forEach((participant) => {
      const publication = participant.getTrackPublication(Track.Source.Microphone);
      micStates[participant.identity] = !!publication && !publication.isMuted;
    });
    setParticipantMicStates(micStates);
    setActive(!!micStates[room.localParticipant.identity]);
    setLocalSpeaking(room.localParticipant.isSpeaking && !!micStates[room.localParticipant.identity]);
    setDebug({
      participantCount: people.length,
      remoteParticipants: room.remoteParticipants.size,
      remoteTracks: audioElementsRef.current.size,
      playback: room.canPlaybackAudio ? 'oynatılıyor' : 'engellendi',
    });
  }, []);

  // Mikrofon seçenekleri: gürültü engelleme tercihi burada uygulanır.
  const micOptions = () => ({ echoCancellation: true, autoGainControl: true, noiseSuppression: noiseSuppressionRef.current });

  const attachRemoteAudio = useCallback((track) => {
    if (track.kind !== Track.Kind.Audio) return;
    // Hoparlör kapalıyken ses elementi oluşturma; açıldığında yeniden bağlanır.
    if (deafenedRef.current) return;
    const mediaTrackId = track.mediaStreamTrack?.id || '';
    const existing = [...audioElementsRef.current].find((element) => element.dataset.livekitTrack === track.sid);
    if (existing?.dataset.livekitMediaTrack === mediaTrackId) return;
    if (existing) {
      audioElementsRef.current.delete(existing);
      existing.remove();
    }
    const element = createVoiceOutput(track, roomId);
    element.dataset.livekitVoice = roomId;
    element.dataset.livekitTrack = track.sid;
    element.dataset.livekitMediaTrack = mediaTrackId;
    element.muted = deafenedRef.current;
    audioElementsRef.current.add(element);
    // Mikrofon izninden bağımsız, önceden açılmış kalıcı ses kanalından oynat.
    Promise.all([roomRef.current?.startAudio(), element.play(), unlockVoicePlayback()]).then(() => {
      setAudioBlocked(false);
      setError('');
    }).catch(() => {
      setAudioBlocked(true);
      setError('🔊 Sesi başlatmak için ekrana dokunun.');
    });
    refreshState();
  }, [refreshState, roomId]);

  const retryAudio = useCallback(async () => {
    try {
      // Mikrofon izni, LiveKit'in genel oynatıcısı ve uzak ses çıkışları
      // birbirinden bağımsızdır; birinin reddi diğerini durdurmamalıdır.
      await unlockVoicePlayback().catch(() => {});
      await roomRef.current?.startAudio().catch(() => {});
      const outputs = [...audioElementsRef.current];
      const results = await Promise.allSettled(outputs.map((element) => element.play()));
      if (outputs.length && results.every((result) => result.status === 'rejected')) throw results[0].reason;
      setAudioBlocked(false);
      setError('');
      refreshState();
    } catch (playError) {
      console.warn('[LiveKit] Audio playback could not start', playError);
      setAudioBlocked(true);
      setError('🔊 Ses başlatılamadı. Ekrana dokunarak tekrar deneyin.');
    }
  }, [refreshState]);

  useEffect(() => {
    if (!voiceEnabled || !roomId || !user?.id || callAudioPaused || hasDirectCallAudioFocus()) return;
    let cancelled = false;
    const room = new Room({ adaptiveStream: true, dynacast: true, autoSubscribe: true });
    roomRef.current = room;

    const updateSpeakers = (speakers) => {
      setSpeakingIds(speakers.filter((participant) => participant.identity !== user.id).map((participant) => participant.identity));
      refreshState();
    };
    const onUnsubscribed = (track) => {
      audioElementsRef.current.forEach((element) => {
        if (element.dataset.livekitTrack !== track.sid) return;
        audioElementsRef.current.delete(element);
        element.remove();
      });
      track.detach().forEach((element) => element.remove());
      refreshState();
    };
    const onDisconnected = () => { setConnectionState('disconnected'); setError('🌐 Bağlantı yeniden kuruluyor.'); };
    // Hoparlör kapatıldığında uzak ses yayınını tamamen kes, açıldığında geri bağla.
    const setRemoteAudioActive = (active) => {
      room.remoteParticipants.forEach((participant) => {
        participant.audioTrackPublications.forEach((publication) => {
          if (active) {
            if (!publication.isSubscribed) publication.setSubscribed(true).catch(() => {});
            if (publication.track) attachRemoteAudio(publication.track);
          } else {
            publication.setSubscribed(false).catch(() => {});
          }
        });
      });
    };
    remoteAudioControlRef.current = setRemoteAudioActive;
    const subscribeParticipantAudio = (participant) => {
      if (deafenedRef.current) return;
      participant.audioTrackPublications.forEach((publication) => {
        if (!publication.isSubscribed) publication.setSubscribed(true);
        if (publication.track) attachRemoteAudio(publication.track);
      });
    };
    const attachCurrentRemoteAudio = () => {
      room.remoteParticipants.forEach(subscribeParticipantAudio);
    };
    const onParticipantConnected = (participant) => {
      subscribeParticipantAudio(participant);
      refreshState();
    };
    const onTrackPublished = (publication) => {
      if (publication.source === Track.Source.Microphone || publication.kind === Track.Kind.Audio) {
        if (!deafenedRef.current) {
          publication.setSubscribed(true);
          if (publication.track) attachRemoteAudio(publication.track);
        }
      }
      refreshState();
    };

    room.on(RoomEvent.TrackSubscribed, attachRemoteAudio);
    room.on(RoomEvent.TrackUnsubscribed, onUnsubscribed);
    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, refreshState);
    room.on(RoomEvent.TrackPublished, onTrackPublished);
    room.on(RoomEvent.TrackUnpublished, refreshState);
    room.on(RoomEvent.TrackMuted, refreshState);
    room.on(RoomEvent.TrackUnmuted, refreshState);
    room.on(RoomEvent.LocalTrackPublished, refreshState);
    room.on(RoomEvent.LocalTrackUnpublished, refreshState);
    room.on(RoomEvent.ActiveSpeakersChanged, updateSpeakers);
    room.on(RoomEvent.Reconnecting, () => { setConnectionState('reconnecting'); setError('🌐 Bağlantı yeniden kuruluyor.'); });
    room.on(RoomEvent.Reconnected, async () => {
      setConnectionState('connected');
      setError('');
      attachCurrentRemoteAudio();
      await retryAudio();
      if (!hasDirectCallAudioFocus() && !mutedByModeratorRef.current && voiceEnabledRef.current && micEnabledRef.current && room.localParticipant.getTrackPublication(Track.Source.Microphone)?.isMuted) {
        room.localParticipant.setMicrophoneEnabled(true, micOptions()).catch(() => {});
      }
      refreshState();
    });
    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.AudioPlaybackStatusChanged, () => { setAudioBlocked(!room.canPlaybackAudio); refreshState(); });

    (async () => {
      try {
        setConnectionState('connecting');
        const response = await base44.functions.invoke('livekitToken', {
          roomName: roomId,
          participantName: user.title || user.username || user.full_name || 'Kullanıcı',
        });
        if (cancelled || hasDirectCallAudioFocus()) return;
        await room.connect(response.data.url, response.data.token, { autoSubscribe: true });
        if (cancelled || hasDirectCallAudioFocus()) { await room.disconnect(true); return; }
        setConnectionState('connected');
        setError('');
        // Hoparlörü mikrofon izninden bağımsız başlat, ardından mikrofonu hemen yayınla.
        attachCurrentRemoteAudio();
        await retryAudio();
        setAudioBlocked(!room.canPlaybackAudio);
        if (!hasDirectCallAudioFocus() && !mutedByModeratorRef.current && voiceEnabledRef.current && micEnabledRef.current) {
          setRequesting(true);
          try {
            await room.localParticipant.setMicrophoneEnabled(true, micOptions());
          } catch (micError) {
            // Mikrofon reddedilse bile kullanıcı dinleyici olarak bağlı kalır.
            attachCurrentRemoteAudio();
            await retryAudio();
            setError(friendlyMicError(micError));
          } finally {
            setRequesting(false);
          }
        }
        refreshState();
      } catch (connectError) {
        if (cancelled || connectError?.name === 'AbortError') return;
        console.error('[LiveKit] Connection failed', connectError);
        setConnectionState('disconnected');
        setError('🌐 Ses bağlantısı kurulamadı.');
      }
    })();

    // Mikrofon izninden bağımsız olarak her kullanıcı etkileşiminde uzak sesi hazır tut.
    // Dinleyici kalıcıdır; sonradan yayınlanan sesler de sayfa değiştirmeden başlar.
    const startAudioOnInteraction = () => { attachCurrentRemoteAudio(); retryAudio(); };
    document.addEventListener('pointerdown', startAudioOnInteraction, { passive: true });
    document.addEventListener('touchend', startAudioOnInteraction, { passive: true });
    document.addEventListener('keydown', startAudioOnInteraction);
    const restoreOnVisible = () => {
      if (document.visibilityState === 'visible') {
        attachCurrentRemoteAudio();
        retryAudio();
      }
    };
    document.addEventListener('visibilitychange', restoreOnVisible);
    window.addEventListener('orientationchange', startAudioOnInteraction);
    const recoveryTimer = window.setInterval(() => {
      attachCurrentRemoteAudio();
      if (room.canPlaybackAudio && audioElementsRef.current.size > 0) retryAudio();
    }, 2000);

    return () => {
      cancelled = true;
      remoteAudioControlRef.current = null;
      room.removeAllListeners();
      audioElementsRef.current.forEach((element) => element.remove());
      audioElementsRef.current.clear();
      room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
      room.disconnect();
      if (roomRef.current === room) roomRef.current = null;
      document.removeEventListener('pointerdown', startAudioOnInteraction);
      document.removeEventListener('touchend', startAudioOnInteraction);
      document.removeEventListener('keydown', startAudioOnInteraction);
      document.removeEventListener('visibilitychange', restoreOnVisible);
      window.removeEventListener('orientationchange', startAudioOnInteraction);
      window.clearInterval(recoveryTimer);
      setActive(false);
      setSpeakingIds([]);
      setParticipantMicStates({});
      setConnectionState('disconnected');
      setDebug(initialDebug);
    };
  }, [attachRemoteAudio, refreshState, retryAudio, roomId, user?.id, everVoiceEnabled, callAudioPaused]);

  useEffect(() => {
    const moderatorMuted = !!participants?.find((participant) => participant.user_id === user?.id)?.muted;
    mutedByModeratorRef.current = moderatorMuted;
    setRemoteMuted(moderatorMuted);
    if (moderatorMuted && roomRef.current) {
      roomRef.current.localParticipant.setMicrophoneEnabled(false).then(refreshState).catch(() => {});
    }
  }, [participants, refreshState, user?.id]);

  // Sesli sohbet kapatıldığında tüm mikrofonları ve uzak sesleri anlık kapat;
  // tekrar açıldığında mikrofon izni tekrar istenmeden sesleri geri aç.
  useEffect(() => {
    const room = roomRef.current;
    if (!room || hasDirectCallAudioFocus()) return;
    if (!voiceEnabled) {
      room.localParticipant.setMicrophoneEnabled(false).then(refreshState).catch(() => {});
      audioElementsRef.current.forEach((element) => { element.muted = true; });
      setActive(false);
    } else {
      if (!mutedByModeratorRef.current && micEnabledRef.current) {
        room.localParticipant.setMicrophoneEnabled(true, micOptions()).then(refreshState).catch(() => {});
      }
      audioElementsRef.current.forEach((element) => { element.muted = deafenedRef.current; });
      retryAudio();
    }
  }, [voiceEnabled]);

  // Koltuğa oturunca mikrofon açılır, koltuktan kalkınca kapanır (izin tekrar istenmez).
  useEffect(() => {
    if (micEnabled === undefined) return;
    const next = micEnabled !== false;
    if (micAppliedRef.current === next) return;
    micAppliedRef.current = next;
    const room = roomRef.current;
    if (!room || hasDirectCallAudioFocus() || connectionState !== 'connected' || mutedByModeratorRef.current) return;
    room.localParticipant.setMicrophoneEnabled(next, micOptions())
      .then(refreshState)
      .catch(() => {});
  }, [micEnabled, connectionState, refreshState]);

  const toggleMute = useCallback(async () => {
    const room = roomRef.current;
    if (!room || hasDirectCallAudioFocus() || requesting || mutedByModeratorRef.current || connectionState !== 'connected') return;
    if (!voiceEnabledRef.current && !active) return;
    setRequesting(true);
    setError('');
    try {
      if (active) await room.localParticipant.setMicrophoneEnabled(false);
      else await room.localParticipant.setMicrophoneEnabled(true, micOptions());
      refreshState();
    } catch (micError) {
      console.error('[LiveKit] Microphone toggle failed', micError);
      await retryAudio();
      setError(friendlyMicError(micError));
    } finally { setRequesting(false); }
  }, [active, connectionState, refreshState, requesting, retryAudio]);

  const toggleDeafen = useCallback(() => {
    const next = !deafenedRef.current;
    deafenedRef.current = next;
    setDeafened(next);
    audioElementsRef.current.forEach((element) => { element.muted = next; });
    remoteAudioControlRef.current?.(!next);
    if (!next) retryAudio();
  }, [retryAudio]);

  // Gürültü engelleme: mikrofon ayarlarına anında uygulanır ve sonraki açılışlarda geçerli olur.
  const toggleNoiseSuppression = useCallback(() => {
    const next = !noiseSuppressionRef.current;
    noiseSuppressionRef.current = next;
    setNoiseSuppression(next);
    try { localStorage.setItem(NOISE_KEY, next ? 'on' : 'off'); } catch {}
    const media = roomRef.current?.localParticipant.getTrackPublication(Track.Source.Microphone)?.track?.mediaStreamTrack;
    if (media?.applyConstraints) {
      media.applyConstraints({ noiseSuppression: next, echoCancellation: true, autoGainControl: true }).catch(() => {});
    }
  }, []);

  return { muted: !active, remoteMuted, deafened, noiseSuppression, toggleNoiseSuppression, localSpeaking, speakingIds, participantMicStates, active, error, requesting, connectionState, audioBlocked, retryAudio, toggleMute, toggleDeafen, debug, voiceEnabled };
}