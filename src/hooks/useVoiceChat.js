import { useCallback, useEffect, useRef, useState } from 'react';
import { DisconnectReason, Room, RoomEvent, Track } from 'livekit-client';
import { base44 } from '@/api/base44Client';
import { createVoiceOutput, unlockVoicePlayback } from '@/lib/callAudio';
import { hasDirectCallAudioFocus, subscribeCallAudioFocus } from '@/lib/callAudioFocus';
import { hasSharedMic, releaseSharedMic, setSharedMicActive, sharedMicTrack } from '@/lib/micSource';
import { isRoomMinimized } from '@/lib/minimizedRoom';
import { disposeOtherVoiceSessions, registerVoiceSession, takeVoiceSession } from '@/lib/roomVoiceSession';
import shallowEqual from '@/components/data/shallowEqual';

const initialDebug = { participantCount: 0, remoteParticipants: 0, remoteTracks: 0, playback: 'hazır' };
// Mikrofon izni verilmese bile kişi odayı dinlemeye devam eder; mesaj bunu açıkça söyler.
const friendlyMicError = (error) => {
  if (error?.name === 'NotAllowedError') return '🎤 Mikrofon izni verilmedi — diğerlerini duymaya devam edersin.';
  if (error?.name === 'NotReadableError') return '🎤 Mikrofon kullanılamıyor — diğerlerini duymaya devam edersin.';
  return '🎤 Mikrofon başlatılamadı — diğerlerini duymaya devam edersin.';
};

export function useVoiceChat({ roomId, user, participants, voiceEnabled, micEnabled }) {
  const roomRef = useRef(null);
  const [callAudioPaused, setCallAudioPaused] = useState(hasDirectCallAudioFocus);
  useEffect(() => subscribeCallAudioFocus((paused) => {
    setCallAudioPaused(paused);
    // Doğrudan arama sesi alsın: kanal kapatılmaz, yalnızca susturulur (izin korunur).
    if (paused) { setSharedMicActive(false); roomRef.current?.disconnect(false); }
  }), []);
  const audioElementsRef = useRef(new Set());
  const mutedByModeratorRef = useRef(false);
  const deafenedRef = useRef(false);
  const remoteAudioControlRef = useRef(null);
  const [active, setActive] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const micTogglePendingRef = useRef(false);
  const micEnablePendingRef = useRef(new WeakMap());
  const [deafened, setDeafened] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [speakingIds, setSpeakingIds] = useState([]);
  const [participantMicStates, setParticipantMicStates] = useState({});
  const [connectionState, setConnectionState] = useState('disconnected');
  const [error, setError] = useState('');
  const [micDenied, setMicDenied] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [debug, setDebug] = useState(initialDebug);
  const [everVoiceEnabled, setEverVoiceEnabled] = useState(voiceEnabled);
  // Arka plandan dönüşte bağlantı yeniden kurulur: oda ve koltuk kaydı değişmez.
  const [sessionKey, setSessionKey] = useState(0);
  // Mikrofonu kullanıcı kendisi kapatmadıysa arka plandan dönüşte kendiliğinden geri açılır.
  const micWantedRef = useRef(micEnabled !== false);
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
      const media = publication?.track?.mediaStreamTrack;
      micStates[participant.identity] = !!publication && !publication.isMuted && (!participant.isLocal || (media?.readyState === 'live' && media.enabled && !media.muted));
    });
    setParticipantMicStates((previous) => shallowEqual(previous, micStates) ? previous : micStates);
    setActive(!!micStates[room.localParticipant.identity]);
    setLocalSpeaking(room.localParticipant.isSpeaking && !!micStates[room.localParticipant.identity]);
    const nextDebug = {
      participantCount: people.length,
      remoteParticipants: room.remoteParticipants.size,
      remoteTracks: audioElementsRef.current.size,
      playback: room.canPlaybackAudio ? 'oynatılıyor' : 'engellendi',
    };
    setDebug((previous) => shallowEqual(previous, nextDebug) ? previous : nextDebug);
  }, []);

  // Mikrofonu aç: yayın varsa yalnızca geri açılır, yoksa izinli paylaşılan kanal yayınlanır.
  // Böylece izin bir kez verilir ve arayüz geçişlerinde tekrar sorulmaz.
  // İzin reddedilmişse micDenied durumu çıkar — kullanıcı ayarlardan izin verip
  // geri döndüğünde otomatik olarak yeniden denenecek.
  const enableMic = useCallback(async (room) => {
    if (!room || room.state !== 'connected' || mutedByModeratorRef.current || !voiceEnabledRef.current || hasDirectCallAudioFocus()) return;
    micWantedRef.current = true;
    const pending = micEnablePendingRef.current.get(room);
    if (pending) return pending;
    const request = (async () => {
      const publication = room.localParticipant.getTrackPublication(Track.Source.Microphone);
      if (publication?.track) {
        const media = publication.track.mediaStreamTrack;
        if (media.readyState === 'ended' || media.muted) {
          const replacement = await sharedMicTrack({ fresh: true });
          if (!replacement || roomRef.current !== room || room.state !== 'connected' || !micWantedRef.current || mutedByModeratorRef.current) return;
          await publication.track.replaceTrack(replacement);
        }
        if (publication.isMuted) await room.localParticipant.setMicrophoneEnabled(true);
        publication.track.mediaStreamTrack.enabled = true;
        setSharedMicActive(true);
        setMicDenied(false);
        return;
      }
      const track = await sharedMicTrack();
      if (!track || roomRef.current !== room || room.state !== 'connected' || !micWantedRef.current || mutedByModeratorRef.current) return;
      setSharedMicActive(true);
      setMicDenied(false);
      await room.localParticipant.publishTrack(track, { source: Track.Source.Microphone });
    })();
    micEnablePendingRef.current.set(room, request);
    try { await request; }
    catch (err) {
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') setMicDenied(true);
      throw err;
    }
    finally { if (micEnablePendingRef.current.get(room) === request) micEnablePendingRef.current.delete(room); }
  }, []);

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
      const unlock = unlockVoicePlayback().catch(() => {});
      const start = roomRef.current?.startAudio().catch(() => {});
      const outputs = [...audioElementsRef.current];
      const playing = Promise.allSettled(outputs.map((element) => element.play()));
      await Promise.all([unlock, start]);
      const results = await playing;
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
    // Küçültülmüş odadan dönüş: bağlantı ve mikrofon yayını hâlâ ayakta, yalnızca arayüz bağlanır.
    disposeOtherVoiceSessions(roomId);
    const resumed = takeVoiceSession(roomId);
    // stopLocalTrackOnUnpublish: false — izinli mikrofon kanalı oda değişiminde korunur.
    const room = resumed?.room || new Room({ adaptiveStream: true, dynacast: true, autoSubscribe: true, stopLocalTrackOnUnpublish: false });
    if (resumed) {
      // Önceki arayüzün dinleyicileri bırakılır, canlı bağlantı olduğu gibi devralınır.
      room.removeAllListeners();
      resumed.elements?.forEach((element) => audioElementsRef.current.add(element));
    }
    roomRef.current = room;

    const updateSpeakers = (speakers) => {
      const nextIds = speakers.filter((participant) => participant.identity !== user.id).map((participant) => participant.identity);
      setSpeakingIds((previous) => previous.length === nextIds.length && previous.every((id, index) => id === nextIds[index]) ? previous : nextIds);
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
    // Bağlantı düşerse sayfa öndeyken sessizce yeniden kurulur; oda ve koltuk korunur.
    const onDisconnected = (reason) => {
      setConnectionState('disconnected');
      if (reason === DisconnectReason.DUPLICATE_IDENTITY) { setError('🌐 Bu hesap başka bir cihazda odaya bağlandı.'); return; }
      if (document.visibilityState === 'visible') setSessionKey((value) => value + 1);
      else setError('🌐 Bağlantı kesildi — uygulamaya dönünce yeniden bağlanılır.');
    };
    // Hoparlör kapatıldığında uzak ses yayınını tamamen kes, açıldığında geri bağla.
    const setRemoteAudioActive = (active) => {
      room.remoteParticipants.forEach((participant) => {
        participant.audioTrackPublications.forEach((publication) => {
          if (active) {
            if (!publication.isSubscribed) publication.setSubscribed(true);
            if (publication.track) attachRemoteAudio(publication.track);
          } else {
            publication.setSubscribed(false);
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
      if (!hasDirectCallAudioFocus() && !mutedByModeratorRef.current && voiceEnabledRef.current && micWantedRef.current) {
        enableMic(room).catch(() => {});
      }
      refreshState();
    });
    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.AudioPlaybackStatusChanged, () => { setAudioBlocked(!room.canPlaybackAudio); refreshState(); });

    (async () => {
      try {
        // Küçültülmüş odadan dönüldü: yeniden bağlanılmaz, ses ve mikrofon aynen sürer.
        if (resumed) {
          setConnectionState('connected');
          resumed.elements?.forEach((element) => { element.muted = deafenedRef.current; element.play().catch(() => {}); });
          attachCurrentRemoteAudio();
          await retryAudio();
          setAudioBlocked(!room.canPlaybackAudio);
          if (!hasDirectCallAudioFocus() && !mutedByModeratorRef.current && voiceEnabledRef.current && micWantedRef.current) {
            await enableMic(room).catch(() => {});
          }
          refreshState();
          return;
        }
        setConnectionState('connecting');
        const response = await base44.functions.invoke('livekitToken', {
          roomName: roomId,
          participantName: user.title || user.username || user.full_name || 'Kullanıcı',
        });
        if (cancelled || hasDirectCallAudioFocus()) return;
        await room.connect(response.data.url, response.data.token, { autoSubscribe: true });
        if (cancelled || hasDirectCallAudioFocus()) { await room.disconnect(false); return; }
        setConnectionState('connected');
        setError('');
        // Hoparlörü mikrofon izninden bağımsız başlat, ardından mikrofonu hemen yayınla.
        attachCurrentRemoteAudio();
        await retryAudio();
        setAudioBlocked(!room.canPlaybackAudio);
        let carryMic = false;
        try { carryMic = sessionStorage.getItem('voice_mic_carry') === '1'; sessionStorage.removeItem('voice_mic_carry'); } catch {}
        if (!hasDirectCallAudioFocus() && !mutedByModeratorRef.current && voiceEnabledRef.current && (micWantedRef.current || carryMic)) {
          setRequesting(true);
          try {
            await enableMic(room);
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
    // Arka plandan dönüş: bağlantı düşmüşse yeniden kurulur, mikrofon kapanmışsa geri açılır —
    // kullanıcı odaya tekrar girmeden konuşmaya devam eder.
    // İzin daha önce reddedilmişse, kullanıcı ayarlardan izin verip geri döndüğünde
    // otomatik olarak mikrofon açılır (micDenied guide'ı bu geri dönüşü tetikler).
    const restoreOnVisible = () => {
      if (document.visibilityState === 'hidden') return;
      attachCurrentRemoteAudio();
      retryAudio();
      if (room.state === 'disconnected') { setSessionKey((value) => value + 1); return; }
      if (micWantedRef.current && !mutedByModeratorRef.current && voiceEnabledRef.current) {
        enableMic(room).then(refreshState).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', restoreOnVisible);
    window.addEventListener('focus', restoreOnVisible);
    window.addEventListener('orientationchange', startAudioOnInteraction);
    const recoveryTimer = window.setInterval(() => {
      attachCurrentRemoteAudio();
      if (room.canPlaybackAudio && audioElementsRef.current.size > 0) retryAudio();
    }, 2000);

    const stopTransient = () => {
      document.removeEventListener('pointerdown', startAudioOnInteraction);
      document.removeEventListener('touchend', startAudioOnInteraction);
      document.removeEventListener('keydown', startAudioOnInteraction);
      document.removeEventListener('visibilitychange', restoreOnVisible);
      window.removeEventListener('focus', restoreOnVisible);
      window.removeEventListener('orientationchange', startAudioOnInteraction);
      window.clearInterval(recoveryTimer);
    };

    return () => {
      cancelled = true;
      remoteAudioControlRef.current = null;
      // Oda küçültüldüyse ses oturumu sayfadan bağımsız yaşar: mikrofon yayında kalır,
      // oda sesi duyulmaya devam eder — odaya dönüldüğünde aynı bağlantı yeniden kullanılır.
      if (isRoomMinimized(roomId)) {
        stopTransient();
        registerVoiceSession(roomId, { room, elements: audioElementsRef.current, stopTransient });
        return;
      }
      // Odalar arası geçişte mikrofon açıksa yeni odada da açık kalsın.
      try { sessionStorage.setItem('voice_mic_carry', room.localParticipant.isMicrophoneEnabled ? '1' : '0'); } catch {}
      room.removeAllListeners();
      audioElementsRef.current.forEach((element) => element.remove());
      audioElementsRef.current.clear();
      // İzinli kanal durdurulmaz; yayından çıkarılır ve kısa süre sonra bırakılır.
      // Kanaldan çıkılırken ses yakalanmasın; kanal durdurulmaz, izin korunur.
      setSharedMicActive(false);
      room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
      const micPublication = room.localParticipant.getTrackPublication(Track.Source.Microphone);
      if (micPublication?.track && hasSharedMic()) {
        room.localParticipant.unpublishTrack(micPublication.track, false).catch(() => {});
      }
      // disconnect(false): yerel mikrofon kanalı durdurulmaz, izin korunur.
      room.disconnect(false);
      releaseSharedMic();
      if (roomRef.current === room) roomRef.current = null;
      stopTransient();
      setActive(false);
      setSpeakingIds([]);
      setParticipantMicStates({});
      setConnectionState('disconnected');
      setDebug(initialDebug);
    };
  }, [attachRemoteAudio, enableMic, refreshState, retryAudio, roomId, user?.id, everVoiceEnabled, callAudioPaused, sessionKey]);

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
        enableMic(room).then(refreshState).catch(() => {});
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
    micWantedRef.current = next;
    const room = roomRef.current;
    if (!room || hasDirectCallAudioFocus() || connectionState !== 'connected' || mutedByModeratorRef.current) return;
    // Mikrofon reddedilse bile dinleme sürer: uzak ses bir kez daha bağlanıp oynatılır.
    if (next) enableMic(room).then(refreshState).catch(() => { retryAudio(); refreshState(); });
    else room.localParticipant.setMicrophoneEnabled(false).then(refreshState).catch(() => {});
  }, [micEnabled, connectionState, refreshState]);

  const toggleMute = useCallback(async () => {
    const room = roomRef.current;
    if (hasDirectCallAudioFocus() || requesting || micTogglePendingRef.current || mutedByModeratorRef.current || !voiceEnabledRef.current) return;
    retryAudio();
    if (!room || room.state !== 'connected') {
      micWantedRef.current = true;
      if (!room || room.state === 'disconnected') setSessionKey(value => value + 1);
      return;
    }
    micTogglePendingRef.current = true;
    setRequesting(true);
    setError('');
    try {
      const publication = room.localParticipant.getTrackPublication(Track.Source.Microphone);
      const media = publication?.track?.mediaStreamTrack;
      const transmitting = publication && !publication.isMuted && media?.readyState === 'live' && media.enabled && !media.muted;
      if (transmitting) { micWantedRef.current = false; await room.localParticipant.setMicrophoneEnabled(false); }
      else await enableMic(room);
      refreshState();
    } catch (micError) {
      console.error('[LiveKit] Microphone toggle failed', micError);
      await retryAudio();
      setError(friendlyMicError(micError));
    } finally { micTogglePendingRef.current = false; setRequesting(false); }
  }, [active, connectionState, refreshState, requesting, retryAudio]);

  const toggleDeafen = useCallback(() => {
    const next = !deafenedRef.current;
    deafenedRef.current = next;
    setDeafened(next);
    audioElementsRef.current.forEach((element) => { element.muted = next; });
    remoteAudioControlRef.current?.(!next);
    if (!next) retryAudio();
  }, [retryAudio]);

  // Kullanıcı "Tekrar dene" dediğinde veya ayarlardan dönüp geri geldiğinde mikrofonu
  // sessizce yeniden dener — izin verilmişse açılır, yoksa guide diyalogu açık kalır.
  const retryMic = useCallback(() => {
    const room = roomRef.current;
    if (!room || room.state !== 'connected') return;
    enableMic(room).then(refreshState).catch(() => {});
  }, [enableMic, refreshState]);

  return { muted: !active, remoteMuted, deafened, localSpeaking, speakingIds, participantMicStates, active, error, micDenied, requesting, connectionState, audioBlocked, retryAudio, retryMic, toggleMute, toggleDeafen, debug, voiceEnabled };
}