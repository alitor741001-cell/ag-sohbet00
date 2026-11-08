import { useCallback, useEffect, useRef, useState } from 'react';
import { unlockVoicePlayback } from '@/lib/callAudio';
import { hasDirectCallAudioFocus, subscribeCallAudioFocus } from '@/lib/callAudioFocus';
import { isRoomMinimized } from '@/lib/minimizedRoom';
import { disposeOtherVoiceSessions, offerVoiceHandoff, registerVoiceSession, takeVoiceSession } from '@/lib/roomVoiceSession';
import { LiveKitVoiceRoom } from '@/lib/livekitVoiceRoom';
import shallowEqual from '@/components/data/shallowEqual';
import useSeatMicConsent from '@/hooks/useSeatMicConsent';

const initialDebug = { participantCount: 0, remoteParticipants: 0, remoteTracks: 0, playback: 'hazır' };
// İzin bir kez verildiyse hatırlanır: sonraki girişlerde mikrofon kendiliğinden açılır.
const MIC_ALLOWED_KEY = 'voice_mic_allowed';
const micAllowedBefore = () => {
  try { return localStorage.getItem(MIC_ALLOWED_KEY) === '1'; } catch { return false; }
};
const rememberMicAllowed = () => {
  try { localStorage.setItem(MIC_ALLOWED_KEY, '1'); } catch {}
};
// Tarayıcı izni daha önce verildiyse mikrofon kendiliğinden açılabilir. İzin henüz
// sorulmadıysa mikrofon yalnızca kişi mikrofon düğmesine bastığında istenir.
const micPermissionGranted = async () => {
  try {
    const status = await navigator.permissions.query({ name: 'microphone' });
    return status.state === 'granted';
  } catch { return false; }
};
// Mikrofon izni verilmese bile kişi odayı dinlemeye devam eder; mesaj bunu açıkça söyler.
const subscriptionError = '💎 Sesli odada konuşmak abonelik gerektirir — dinlemeye devam edebilirsin.';
const friendlyMicError = (error) => {
  if (error?.code === 'subscription_required') return subscriptionError;
  // iPhone izin penceresi açıkken istek bırakılmaz; pencere görülmeden kapatılan istek
  // "tekrar dene" hatasına dönüşüyordu.
  if (error?.code === 'mic_timeout') return '🎤 Mikrofon izni bekleniyor — çıkan izin penceresinde “İzin Ver”e dokun. Açılmazsa düğmeye tekrar bas.';
  if (error?.code === 'webrtc_unsupported') return '🎤 Bu cihazın tarayıcısı ses iletimini desteklemiyor — uygulamayı güncel Chrome veya Safari ile açmayı dene.';
  if (error?.name === 'NotAllowedError') return '🎤 Mikrofon izni verilmedi — diğerlerini duymaya devam edersin.';
  if (error?.name === 'NotReadableError') return '🎤 Mikrofon kullanılamıyor — diğerlerini duymaya devam edersin.';
  return '🎤 Mikrofon başlatılamadı — diğerlerini duymaya devam edersin.';
};
const isPermissionError = (error) => error?.name === 'NotAllowedError' || error?.name === 'SecurityError';
const sameList = (a, b) => a.length === b.length && a.every((value, index) => value === b[index]);
// Aynı odanın diğer görünümü mü açık (film odası ↔ sesli oda)? Görünüm değişiminde ses
// bağlantısı kapatılmaz: yeni görünüm aynı LiveKit oturumunu devralır, yeniden bağlanılmaz.
const sameRoomViewOpen = (roomId) => {
  if (!roomId) return false;
  const path = window.location.pathname || '';
  return path === `/oda/${roomId}` || path === `/sesli-oda/${roomId}`;
};
const rememberMicCarry = (on) => {
  try { sessionStorage.setItem('voice_mic_carry', on ? '1' : '0'); } catch {}
};

export function useVoiceChat({ roomId, user, participants, voiceEnabled, micEnabled }) {
  const meshRef = useRef(null);
  const { allowed: consentAllowed, prompt: micConsentRequired, allow: allowMicConsent, deny: denyMicConsent } = useSeatMicConsent(roomId, micEnabled);
  const [callAudioPaused, setCallAudioPaused] = useState(hasDirectCallAudioFocus);
  useEffect(() => subscribeCallAudioFocus((paused) => {
    setCallAudioPaused(paused);
    // Doğrudan arama sesi öncelikli: oda sesi kısılır, mikrofon kapanır (izin korunur).
    if (paused) {
      meshRef.current?.setOutputsEnabled(false);
      meshRef.current?.stopMic();
    }
  }), []);
  const mutedByModeratorRef = useRef(false);
  const deafenedRef = useRef(false);
  const [active, setActive] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const micTogglePendingRef = useRef(false);
  const micToggleAtRef = useRef(0);
  // Kişi mikrofon düğmesine bastığında işaretlenir: izin o anda sorulur.
  const micGestureRef = useRef(false);
  const micPendingRef = useRef(null);
  const [deafened, setDeafened] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [speakingIds, setSpeakingIds] = useState([]);
  const [participantMicStates, setParticipantMicStates] = useState({});
  const [connectionState, setConnectionState] = useState('disconnected');
  const [error, setError] = useState('');
  const [micDenied, setMicDenied] = useState(false);
  const [canSpeak, setCanSpeak] = useState(true);
  const [lastMicrophoneError, setLastMicrophoneError] = useState('');
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [debug, setDebug] = useState(initialDebug);
  const [everVoiceEnabled, setEverVoiceEnabled] = useState(voiceEnabled);
  // Arka plandan dönüşte bağlantı yeniden kurulur: oda ve koltuk kaydı değişmez.
  const [sessionKey, setSessionKey] = useState(0);
  // Görüntülü PK kamerası aynı LiveKit odasına yayın yapar: oda nesnesi görünüme verilir.
  const [livekitRoom, setLivekitRoom] = useState(null);
  // Mikrofonu kullanıcı kendisi kapatmadıysa arka plandan dönüşte kendiliğinden geri açılır.
  const micWantedRef = useRef(micEnabled !== false);
  const voiceEnabledRef = useRef(voiceEnabled);
  // Koltuk düzeni: mikrofon yayını yalnızca koltukta oturan kişide açık kalır.
  const micEnabledRef = useRef(micEnabled !== false);
  const micAppliedRef = useRef(null);
  // İzin reddedildiyse kendiliğinden tekrar denenmez; kullanıcı izni verince sıfırlanır.
  const micDeniedRef = useRef(false);
  // Kendiliğinden açma denemeleri seyreltilir (cihazı üst üste meşgul etmesin).
  const micRetryAtRef = useRef(0);
  useEffect(() => { voiceEnabledRef.current = voiceEnabled; if (voiceEnabled) setEverVoiceEnabled(true); }, [voiceEnabled]);
  useEffect(() => { micEnabledRef.current = micEnabled !== false; }, [micEnabled]);

  const refreshState = useCallback(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const snapshot = mesh.getSnapshot();
    setParticipantMicStates((previous) => shallowEqual(previous, snapshot.micStates) ? previous : snapshot.micStates);
    setActive(!!snapshot.selfMicOn);
    setLocalSpeaking(!!snapshot.localSpeaking);
    setSpeakingIds((previous) => sameList(previous, snapshot.speakers) ? previous : snapshot.speakers);
    setConnectionState(snapshot.connectionState);
    setAudioBlocked(!!snapshot.audioBlocked);
    setCanSpeak(snapshot.canPublish !== false);
    const nextDebug = {
      participantCount: snapshot.participantCount,
      remoteParticipants: snapshot.peerCount,
      remoteTracks: snapshot.remoteTracks,
      playback: snapshot.audioBlocked ? 'engellendi' : 'oynatılıyor',
    };
    setDebug((previous) => shallowEqual(previous, nextDebug) ? previous : nextDebug);
  }, []);

  // Tek mikrofon kanalı: izin → kanal → eşlere yayın. Açıldıktan sonra kanalın
  // gerçekten canlı olduğu doğrulanır; sessiz başarısızlık olmaz.
  const enableMic = useCallback(async (mesh, on = true) => {
    if (!mesh) throw new Error('Ses bağlantısı hazır değil.');
    // Hiçbir açılış/kurtarma yolu koltuk onayını atlayamaz.
    if (on && (!consentAllowed.current || mutedByModeratorRef.current || hasDirectCallAudioFocus())) return false;
    if (on && micPendingRef.current) return micPendingRef.current;
    micWantedRef.current = !!on;
    // Takılı kalan eski bir deneme düğmeyi kilitlemez: yeni istek doğrudan başlar.
    if (!on) {
      micDeniedRef.current = false;
      const stop = (async () => {
        mesh.stopMic();
        rememberMicCarry(false);
        setActive(false);
        refreshState();
      })();
      micPendingRef.current = stop;
      try { await stop; } finally { if (micPendingRef.current === stop) micPendingRef.current = null; }
      return;
    }
    const request = (async () => {
      const opened = await mesh.setMicEnabled(true);
      if (meshRef.current !== mesh || !micWantedRef.current) return;
      if (!opened || !mesh.isMicOn()) throw new Error('Mikrofon yayını doğrulanamadı.');
      micDeniedRef.current = false;
      micAppliedRef.current = true;
      setMicDenied(false);
      setLastMicrophoneError('');
      setActive(true);
      rememberMicAllowed();
      // Mikrofon açıkken görünüm değişirse yeni görünümün de açması için niyet saklanır.
      rememberMicCarry(true);
      refreshState();
    })();
    micPendingRef.current = request;
    // Yanıtsız kalan deneme düğmeyi kilitlemez: izin penceresine cevap vermeye yetecek
    // süreden sonra istek bırakılır, düğme yeniden basılabilir olur. Süre kısa
    // tutulduğunda iPhone'da kişi izni veremeden istek kapanıyordu.
    const watchdog = window.setTimeout(() => {
      if (micPendingRef.current !== request) return;
      micPendingRef.current = null;
      mesh.abandonMicRequest?.();
      if (meshRef.current === mesh) {
        setRequesting(false);
        setError('🎤 Mikrofon izni bekleniyor — çıkan izin penceresinde “İzin Ver”e dokun, sonra düğmeye tekrar bas.');
      }
    }, 45000);
    try { await request; }
    catch (err) {
      micDeniedRef.current = isPermissionError(err);
      if (micDeniedRef.current) setMicDenied(true);
      setLastMicrophoneError(mesh.lastMicrophoneError || err?.code || err?.name || 'mic_failed');
      throw err;
    }
    finally {
      window.clearTimeout(watchdog);
      if (micPendingRef.current === request) micPendingRef.current = null;
    }
  }, [refreshState]);

  const retryAudio = useCallback(async () => {
    try {
      const mesh = meshRef.current;
      const played = mesh ? await mesh.retryPlayback() : await unlockVoicePlayback();
      if (!played) throw new Error('Ses oynatma izni bekleniyor.');
      setAudioBlocked(false);
      setError(previous => previous.startsWith('🔊') ? '' : previous);
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
    const mesh = resumed?.room || new LiveKitVoiceRoom({
      roomId,
      user,
      userId: user.id,
      name: user.title || user.username || user.full_name || 'Kullanıcı',
      onChange: () => refreshState(),
    });
    meshRef.current = mesh;

    (async () => {
      try {
        if (resumed) {
          // Devralınan oturum yeni görünümün durumunu besler: mikrofon, konuşan ve
          // hoparlör göstergeleri LiveKit olaylarıyla anlık güncellenir.
          mesh.onChange = () => refreshState();
          setLivekitRoom(mesh.getRoom?.() || null);
          setConnectionState('connected');
          mesh.setOutputsEnabled(true);
          void retryAudio();
          // Oturum devralındığında mikrofon yayındaysa kesilmez: olduğu gibi sürer.
          if (mesh.isMicOn?.()) {
            micWantedRef.current = true;
            micAppliedRef.current = true;
            setActive(true);
            rememberMicCarry(true);
          } else if (!hasDirectCallAudioFocus() && !mutedByModeratorRef.current && voiceEnabledRef.current && micWantedRef.current) {
            // Doğrudan arama sesi yeniden öncelik aldıysa mikrofon kapalı kalır.
            await enableMic(mesh).catch(() => {});
          }
          refreshState();
          return;
        }
        setConnectionState('connecting');
        await mesh.connect();
        if (cancelled || hasDirectCallAudioFocus()) { mesh.close(); return; }
        setConnectionState('connected');
        setLivekitRoom(mesh.getRoom?.() || null);
        setError('');
        void mesh.retryPlayback();
        let carryMic = false;
        try { carryMic = sessionStorage.getItem('voice_mic_carry') === '1'; sessionStorage.removeItem('voice_mic_carry'); } catch {}
        // İzin daha önce verildiyse mikrofon kendiliğinden açılır; henüz sorulmadıysa
        // mikrofon yalnızca kişi düğmeye bastığında, izin sorularak açılır.
        // İzin daha önce verilmişse (mikrofon bir kez açıldıysa) dokunuş beklemeden açılır.
        const mayOpen = micGestureRef.current || micAllowedBefore() || await micPermissionGranted();
        if (!hasDirectCallAudioFocus() && !mutedByModeratorRef.current && voiceEnabledRef.current && mayOpen && (micWantedRef.current || carryMic)) {
          micWantedRef.current = true;
          setRequesting(true);
          try {
            await enableMic(mesh);
          } catch (micError) {
            setError(friendlyMicError(micError));
          } finally {
            setRequesting(false);
          }
        }
        refreshState();
      } catch (connectError) {
        if (cancelled) return;
        console.error('[LiveKit] Connection failed', connectError);
        setConnectionState('disconnected');
        // Sunucudan gelen gerçek sebep gösterilir; bağlantı kurulmadıysa bağlıymış gibi davranılmaz.
        const serverReason = connectError?.response?.data?.error;
        setError(serverReason ? `🌐 ${serverReason}` : '🌐 Ses bağlantısı kurulamadı. Lütfen tekrar dene.');
      }
    })();

    // Mikrofon izninden bağımsız olarak her kullanıcı etkileşiminde uzak sesi hazır tut.
    const startAudioOnInteraction = () => { void retryAudio(); };
    document.addEventListener('pointerdown', startAudioOnInteraction, { passive: true });
    document.addEventListener('touchend', startAudioOnInteraction, { passive: true });
    document.addEventListener('keydown', startAudioOnInteraction);
    // Arka plandan dönüş: bağlantı canlıysa mikrofon geri açılır — kullanıcı odaya
    // tekrar girmeden konuşmaya devam eder.
    const restoreOnVisible = () => {
      if (document.visibilityState === 'hidden') return;
      micDeniedRef.current = false;
      void retryAudio();
      if (micWantedRef.current && micEnabledRef.current && !mutedByModeratorRef.current
        && voiceEnabledRef.current && !hasDirectCallAudioFocus() && !mesh.isMicOn()
        && (micGestureRef.current || micAllowedBefore())) {
        enableMic(mesh).then(refreshState).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', restoreOnVisible);
    window.addEventListener('focus', restoreOnVisible);
    window.addEventListener('orientationchange', startAudioOnInteraction);
    const recoveryTimer = window.setInterval(() => {
      refreshState();
      // Mikrofon açık kalmalı ama yayın düşmüşse kendiliğinden geri kurulur;
      // böylece buton "kapalı" görünüp öyle kalmaz. Denemeler seyreltilir.
      const micBroken = micWantedRef.current && micEnabledRef.current && !micDeniedRef.current && !mutedByModeratorRef.current
        && voiceEnabledRef.current && meshRef.current === mesh && !mesh.isMicOn()
        && !micPendingRef.current && mesh.canPublishNow() && !hasDirectCallAudioFocus()
        && document.visibilityState !== 'hidden' && (micGestureRef.current || micAllowedBefore());
      if (micBroken && Date.now() >= micRetryAtRef.current) {
        micRetryAtRef.current = Date.now() + 6000;
        enableMic(mesh).then(refreshState).catch((micError) => {
          if (isPermissionError(micError)) { micDeniedRef.current = true; setMicDenied(true); }
          refreshState();
        });
      }
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
      // Oda küçültüldüyse ses oturumu sayfadan bağımsız yaşar: mikrofon yayında kalır,
      // oda sesi duyulmaya devam eder — odaya dönüldüğünde aynı bağlantı yeniden kullanılır.
      if (isRoomMinimized(roomId)) {
        stopTransient();
        registerVoiceSession(roomId, { room: mesh, elements: mesh.audioElements(), stopTransient });
        return;
      }
      // Film odası ↔ sesli oda geçişinde bağlantı kapatılmaz: LiveKit odası, mikrofon
      // yayını ve oda sesi yaşamaya devam eder; yeni görünüm aynı oturumu devralır.
      // Böylece geçişte "tekrar bağlanıyor" durumu oluşmaz ve mikrofon açık kalır.
      if (sameRoomViewOpen(roomId)) {
        stopTransient();
        offerVoiceHandoff(roomId, { room: mesh, elements: mesh.audioElements(), stopTransient });
        return;
      }
      // Odalar arası geçişte mikrofon açıksa yeni odada da açık kalsın.
      try { sessionStorage.setItem('voice_mic_carry', mesh.isMicOn() ? '1' : '0'); } catch {}
      mesh.close();
      if (meshRef.current === mesh) meshRef.current = null;
      stopTransient();
      setActive(false);
      setSpeakingIds([]);
      setParticipantMicStates({});
      setConnectionState('disconnected');
      setLivekitRoom(null);
      setDebug(initialDebug);
    };
  }, [enableMic, refreshState, retryAudio, roomId, user?.id, everVoiceEnabled, callAudioPaused, sessionKey]);

  useEffect(() => {
    const moderatorMuted = !!participants?.find((participant) => participant.user_id === user?.id)?.muted;
    mutedByModeratorRef.current = moderatorMuted;
    setRemoteMuted(moderatorMuted);
    if (moderatorMuted && meshRef.current) {
      meshRef.current.stopMic();
      setActive(false);
    }
  }, [participants, user?.id]);

  // Sesli sohbet kapatıldığında tüm mikrofonları ve uzak sesleri anlık kapat;
  // tekrar açıldığında mikrofon izni tekrar istenmeden sesleri geri aç.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || hasDirectCallAudioFocus()) return;
    if (!voiceEnabled) {
      mesh.stopMic();
      mesh.setOutputsEnabled(false);
      setActive(false);
    } else {
      mesh.setOutputsEnabled(true);
      if (!mutedByModeratorRef.current && micEnabledRef.current) {
        void micPermissionGranted().then((granted) => {
          if (granted || micGestureRef.current) enableMic(mesh).then(refreshState).catch(() => {});
        });
      }
      void retryAudio();
    }
  }, [voiceEnabled]);

  // Koltuğa oturunca mikrofon açılır, koltuktan kalkınca kapanır (izin tekrar istenmez).
  useEffect(() => {
    if (micEnabled === undefined) return;
    const next = micEnabled !== false;
    micWantedRef.current = next;
    const mesh = meshRef.current;
    if (!mesh || hasDirectCallAudioFocus() || connectionState !== 'connected' || mutedByModeratorRef.current) return;
    // Bağlantı hazır olduğunda tekrar denenir: bağlantı kurulmadan gelen istek kaybolmaz.
    if (micAppliedRef.current === next) return;
    // Mikrofon reddedilse bile dinleme sürer.
    if (next) {
      micDeniedRef.current = false;
      if (!consentAllowed.current) return;
      // İzin henüz sorulmadıysa mikrofon kendiliğinden açılmaz: izin kişi düğmeye
      // bastığında sorulur.
      Promise.resolve(micGestureRef.current || micPermissionGranted()).then((mayOpen) => {
        if (!mayOpen) { micAppliedRef.current = false; return; }
        enableMic(mesh).then(() => { micAppliedRef.current = true; refreshState(); }).catch(() => { refreshState(); });
      });
    } else {
      micAppliedRef.current = false;
      // Koltuktan kalkınca yayın kapanır ve istek sıfırlanır (kendiliğinden geri açılmaz).
      enableMic(mesh, false).catch(() => {});
    }
  }, [enableMic, micEnabled, connectionState, refreshState]);

  // Buton hiçbir durumda sessizce boşa basmaz: ya mikrofonu açar/kapatır ya da
  // bağlantıyı yeniden kurup isteği sıraya alır ve durumu ekranda söyler.
  const toggleMute = useCallback(async () => {
    const mesh = meshRef.current;
    if (hasDirectCallAudioFocus() || mutedByModeratorRef.current) return;
    if (!canSpeak) { setError(subscriptionError); return; }
    // Çift dokunma koruması: işlem sürerken ikinci dokunuş yok sayılır.
    if (micTogglePendingRef.current) return;
    allowMicConsent();
    micGestureRef.current = true;
    micTogglePendingRef.current = true;
    void retryAudio();
    setRequesting(true);
    setError('');
    const wasOn = !!mesh?.isMicOn();
    // Dokunuş anındaki gerçek durum: bağlantı, mikrofon ve yayın yetkisi birlikte raporlanır.
    console.info('[LiveKit] Mikrofon düğmesi', {
      action: wasOn ? 'kapat' : 'aç',
      connected: !!mesh?.isConnected(),
      micOn: wasOn,
      canPublish: mesh?.canPublishNow?.() ?? null,
    });
    try {
      if (wasOn) {
        await enableMic(mesh, false);
      } else if (!mesh?.isConnected()) {
        // Bağlantı yokken istek kaybolmaz: istek saklanır, bağlantı kurulduğu an
        // mikrofon kendiliğinden açılır. Kurulmakta olan bağlantı yeniden başlatılmaz.
        micWantedRef.current = true;
        if (mesh?.connectionState === 'connecting') {
          setError('');
        } else {
          setError('🎤 Ses bağlantısı kuruluyor — mikrofon bağlanınca açılacak.');
          setSessionKey((value) => value + 1);
        }
      } else {
        // Mikrofon doğrudan bu dokunuşun içinde açılır, arka plan görevine devredilmez.
        await enableMic(mesh);
      }
      refreshState();
    } catch (micError) {
      console.error('[LiveKit] Microphone toggle failed', micError, { lastMicrophoneError: micError?.code || micError?.name });
      setMicDenied(isPermissionError(micError));
      setError(friendlyMicError(micError));
      // Kayıt oturumu açılamadıysa mobil tarayıcı uzak sesi duraklatabilir: ses geri getirilir.
      void retryAudio();
    } finally { micTogglePendingRef.current = false; setRequesting(false); }
  }, [canSpeak, enableMic, refreshState, retryAudio]);

  const toggleDeafen = useCallback(() => {
    const next = !deafenedRef.current;
    deafenedRef.current = next;
    setDeafened(next);
    meshRef.current?.setDeafened(next);
    if (!next) void retryAudio();
  }, [retryAudio]);

  // Kullanıcı "Tekrar dene" dediğinde veya ayarlardan dönüp geri geldiğinde mikrofonu
  // sessizce yeniden dener — izin verilmişse açılır, yoksa uyarı görünür kalır.
  const retryMic = useCallback(() => {
    allowMicConsent();
    micGestureRef.current = true;
    micWantedRef.current = true;
    const mesh = meshRef.current;
    if (!mesh || connectionState !== 'connected') { setSessionKey((value) => value + 1); return; }
    setRequesting(true);
    setError('');
    return enableMic(mesh).then(refreshState).catch((micError) => {
      setMicDenied(isPermissionError(micError));
      setError(friendlyMicError(micError));
      refreshState();
    }).finally(() => setRequesting(false));
  }, [connectionState, enableMic, refreshState]);

  // Mikrofon düğmesine basıldı: izin bu dokunuşla istenir, verilirse yayın açılır.
  const requestMic = useCallback(() => {
    if (mutedByModeratorRef.current || hasDirectCallAudioFocus()) {
      setError(mutedByModeratorRef.current ? 'Yönetici mikrofonunu kapattı.' : 'Önce özel görüşmeyi sonlandır.');
      return;
    }
    if (!canSpeak) { setError(subscriptionError); return; }
    if (micTogglePendingRef.current) return;
    allowMicConsent();
    micGestureRef.current = true;
    micWantedRef.current = true;
    const mesh = meshRef.current;
    if (!mesh) { setError('🎤 Ses bağlantısı hazır değil — lütfen tekrar dene.'); return; }
    if (!mesh.isConnected()) {
      // Kurulmakta olan bağlantı yeniden başlatılmaz: istek saklanır, bağlantı
      // kurulduğu an mikrofon kendiliğinden açılır.
      if (mesh.connectionState === 'connecting') { setError(''); return; }
      setError('🎤 Ses bağlantısı kuruluyor — mikrofon bağlanınca açılacak.');
      setSessionKey((value) => value + 1);
      return;
    }
    micTogglePendingRef.current = true;
    void retryAudio();
    setRequesting(true);
    setError('');
    enableMic(mesh).then(() => refreshState()).catch((micError) => {
      console.error('[LiveKit] Microphone request failed', micError);
      setMicDenied(isPermissionError(micError));
      setError(friendlyMicError(micError));
      refreshState();
      void retryAudio();
    }).finally(() => { micTogglePendingRef.current = false; setRequesting(false); });
  }, [canSpeak, enableMic, refreshState, retryAudio]);

  const declineMic = () => {
    denyMicConsent();
    micWantedRef.current = false;
    micGestureRef.current = false;
    meshRef.current?.stopMic();
    setActive(false);
    setError('');
  };

  return { muted: !active, remoteMuted, deafened, localSpeaking, speakingIds, participantMicStates, active, error, micDenied, requesting, connectionState, audioBlocked, canSpeak, lastMicrophoneError, retryAudio, retryMic, requestMic, toggleMute, toggleDeafen, debug, voiceEnabled, micConsentRequired, allowConsent: allowMicConsent, declineMic, livekitRoom };
}