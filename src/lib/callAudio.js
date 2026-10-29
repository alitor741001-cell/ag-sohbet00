// Birebir arama ve oda sesi için tek ses motoru.
//
// Burada HİÇ AudioContext kullanılmaz. Eski iOS sürümlerinde çağrı sırasında
// açılan Web Audio, mikrofonu sessize düşürüyor (karşı taraf sesi duymuyordu) ve
// uzak sesi hoparlöre kilitliyordu. Uzak ses doğrudan <audio> elementinden
// çalınır; ahize/hoparlör seçimi iOS'ta navigator.audioSession, diğer
// cihazlarda setSinkId ile yapılır.

// Oda ayarlarındaki "Gürültü engelleyici" anahtarı bu kanalın üzerinde çalışır.
import { getMicNoiseSuppression, getRoomMicTrack, registerRoomMicTrack } from '@/lib/micSource';
import waitForMicReady from '@/lib/waitForMicReady';

// Gürültü engelleme, oda ayarlarındaki anahtardan okunur; kanal her açılışta aynı ayarı alır.
const micOptions = () => ({ echoCancellation: true, noiseSuppression: getMicNoiseSuppression(), autoGainControl: true, channelCount: { ideal: 1 } });
const EARPIECE_RE = /earpiece|receiver|handset|ahize|kulak|communication/i;

let micStream = null;
let micTrack = null;
let micPending = null;
let micPendingAt = 0;
let micGeneration = 0;

let speakerOn = true;
const outputs = new Set();

function releaseMicStream() {
  try { micStream?.getTracks().forEach((track) => track.stop()); } catch {}
  micStream = null;
  micTrack = null;
  registerRoomMicTrack(null);
}

// Eski iOS/Android: mediaDevices bulunmaz, ön ekli getUserMedia kullanılır.
function micGetter() {
  if (navigator.mediaDevices?.getUserMedia) {
    return (constraints) => navigator.mediaDevices.getUserMedia(constraints);
  }
  const legacy = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  if (!legacy) return null;
  return (constraints) => new Promise((resolve, reject) => legacy.call(navigator, constraints, resolve, reject));
}

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });
// Kısıtları anlamayan eski tarayıcılar ve aygıtı henüz bırakmamış Android sürücüleri.
const SIMPLIFY_ERRORS = ['NotSupportedError', 'OverconstrainedError', 'TypeError'];
const DEVICE_BUSY_ERRORS = ['NotReadableError', 'TrackStartError', 'AbortError'];

/** Mikrofonu açar; eski/Android cihazlarda sık görülen hatalarda kendiliğinden yeniden dener. */
async function openAudio(getMedia, constraints, attempt = 0) {
  try {
    return await getMedia(constraints);
  } catch (error) {
    const name = error?.name || '';
    const simplify = SIMPLIFY_ERRORS.includes(name);
    if (!simplify && !DEVICE_BUSY_ERRORS.includes(name)) throw error;
    if (attempt >= 2) throw error;
    // Gelişmiş kısıtlar reddedildiyse sade istekle, aygıt meşgulse kısa bekleyip tekrar denenir.
    if (!simplify) await wait(attempt === 0 ? 200 : 500);
    return openAudio(getMedia, { audio: true }, attempt + 1);
  }
}

async function acquireMic() {
  const getMedia = micGetter();
  if (!getMedia) throw new Error('mikrofon desteklenmiyor');
  const generation = micGeneration;
  // Android aynı giriş aygıtı hâlâ tutulurken ikinci kayıt isteğini reddedebilir.
  // Yeniden edinim gerekiyorsa eski (sessiz/askıda) kayıt önce serbest bırakılır.
  releaseMicStream();
  // Android WebView'in eski ses sürücüleri işleme kısıtlarıyla açılamayabilir.
  const android = /Android/i.test(navigator.userAgent || '');
  const next = await openAudio(getMedia, { audio: android ? true : micOptions() });
  if (generation !== micGeneration) {
    next.getTracks().forEach((track) => track.stop());
    throw new Error('arama sonlandı');
  }
  const track = next.getAudioTracks()[0] || null;
  if (!track) { next.getTracks().forEach((item) => item.stop()); throw new Error('mikrofon yok'); }
  const stale = micStream;
  micStream = next;
  micTrack = track;
  registerRoomMicTrack(track);
  const onEnded = () => {
    if (micTrack === track) { micTrack = null; micStream = null; registerRoomMicTrack(null); }
  };
  if (track.addEventListener) track.addEventListener('ended', onEnded);
  else track.onended = onEnded;
  stale?.getTracks().forEach((oldTrack) => oldTrack.stop());
  // Kayıt açılınca iOS'un playback oturumu bırakılır; mikrofon susturulmaz.
  applySessionType();
  await waitForMicReady(track);
  return track;
}

/**
 * Oturumdaki mikrofon track'i.
 * fresh=true ile aramaya başlarken temiz bir akış alınır: eski iOS sürümlerinde
 * çağrıdan önce açılan akış sessiz kalabiliyor. İzin kullanıcı tarafından bir
 * kez verildiği için tarayıcı tekrar sormaz.
 */
export function ensureMicTrack({ fresh = false } = {}) {
  // İzin penceresinin focus olayı ikinci getUserMedia isteği başlatmamalı.
  if (micPending) return micPending;
  if (!fresh && micTrack && micTrack.readyState === 'live' && !micTrack.muted) {
    micTrack.enabled = true;
    return Promise.resolve(micTrack);
  }
  const generation = ++micGeneration;
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      if (micGeneration === generation) {
        micGeneration += 1;
        releaseMicStream();
      }
      reject(Object.assign(new Error('Mikrofon yanıt vermedi.'), { code: 'mic_timeout' }));
    }, 60000);
  });
  const pending = Promise.race([acquireMic(), timeout]).finally(() => {
    clearTimeout(timer);
    if (micPending === pending) micPending = null;
  });
  micPending = pending;
  return pending;
}

/** Görüşme bitince mikrofonu serbest bırak: sonraki arama temiz bir akışla başlar. */
export function releaseMic() {
  micGeneration += 1;
  micPending = null;
  micPendingAt = 0;
  releaseMicStream();
}

let autoRetryTimer = null;
let autoRetryUntil = 0;

// iOS/Safari uzak sesi ancak bir dokunuştan sonra başlatır. Ses engellendiğinde
// kısa aralıklarla kendiliğinden yeniden denenir: kullanıcı ekrana dokunduğu anda
// ses geri gelir, uygulama kapatılıp açıldığında da takılı kalmaz.
function armAutoRetry() {
  if (autoRetryTimer) return;
  autoRetryUntil = Date.now() + 45000;
  autoRetryTimer = setInterval(() => {
    if (Date.now() > autoRetryUntil) { disarmAutoRetry(); return; }
    retryPlayback();
  }, 1500);
}

function disarmAutoRetry() {
  if (!autoRetryTimer) return;
  clearInterval(autoRetryTimer);
  autoRetryTimer = null;
}

function retryPlayback() {
  let pending = false;
  outputs.forEach((output) => {
    if (output.element?.paused) {
      pending = true;
      output.element.play().catch(() => {});
    }
  });
  if (pending) armAutoRetry();
  else disarmAutoRetry();
}

/** Arayüz uyumluluğu: bekleyen oynatmayı dener. */
export function unlockVoicePlayback() {
  retryPlayback();
  return Promise.resolve(true);
}

// --- Çıkış yönlendirmesi: hoparlör / ahize ---

function audioSession() {
  return typeof navigator !== 'undefined' ? navigator.audioSession : null;
}

/**
 * iOS: 'play-and-record' ahizeyi (kulak kısmını) seçer. Hoparlör için oturum
 * varsayılana bırakılır — 'playback' kategorisi mikrofonu düşürebiliyor.
 */
function applySessionType() {
  const session = audioSession();
  if (!session) return false;
  // iOS: mikrofon kapalıyken 'playback' sesi kesin olarak hoparlöre verir —
  // dinleyen kişi sesi kulağa değil hoparlörden duyar. Mikrofon açıkken 'playback'
  // kaydı düşürebildiği için oturum varsayılanda bırakılır (mikrofon susmaz).
  const microphoneLive = !!getRoomMicTrack();
  try {
    session.type = speakerOn ? (microphoneLive ? 'auto' : 'playback') : 'play-and-record';
    return true;
  } catch { return false; }
}

async function earpieceSinkId() {
  if (!navigator.mediaDevices?.enumerateDevices) return null;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.find((device) => device.kind === 'audiooutput' && EARPIECE_RE.test(device.label))?.deviceId || null;
  } catch { return null; }
}

async function routeOutput(output) {
  const element = output.element;
  applySessionType();
  let routed = false;
  if (typeof element.setSinkId === 'function') {
    try {
      if (speakerOn) {
        await element.setSinkId('');
        routed = true;
      } else {
        const sinkId = await earpieceSinkId();
        if (sinkId) { await element.setSinkId(sinkId); routed = true; }
      }
    } catch {}
  }
  // Ahizesi seçilemeyen cihazlarda (bazı Android) sesi kulak seviyesine indir.
  element.volume = speakerOn || routed ? 1 : 0.55;
  return routed;
}

/** Hoparlör (true) / ahize (false) modunu tüm canlı ses çıkışlarına uygular. */
export function setSpeakerMode(on) {
  speakerOn = !!on;
  return Promise.all([...outputs].map(routeOutput));
}

/** Arama bitince ses oturumunu normal medya moduna döndürür. */
export function resetAudioRouting() {
  speakerOn = true;
  const session = audioSession();
  if (session) { try { session.type = 'auto'; } catch {} }
}

if (typeof window !== 'undefined') {
  // iOS'ta oynatma kullanıcı dokunuşuyla kilidini açar; her dokunuşta denenir.
  window.addEventListener('pointerdown', retryPlayback, { capture: true, passive: true });
  window.addEventListener('touchend', retryPlayback, { capture: true, passive: true });
  window.addEventListener('click', retryPlayback, { capture: true, passive: true });
  // Uygulamaya geri dönüldüğünde (ekran kilidi, uygulama değiştirme) ses yeniden başlatılır.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden') retryPlayback();
  });
}

/**
 * LiveKit track'ini yönlendirilebilir bir <audio> elementine bağlar.
 * Dönen nesne arayüz tarafında element gibi kullanılır (dataset, play, remove, muted).
 */
export function createVoiceOutput(track, roomId, { startMuted = false, nativeOnly = false } = {}) {
  const element = track.attach();
  element.autoplay = true;
  element.playsInline = true;
  element.setAttribute('playsinline', 'true');
  element.style.display = 'none';
  element.muted = startMuted;
  document.body.appendChild(element);

  const output = {
    dataset: {
      livekitVoice: roomId,
      livekitTrack: track.sid,
      livekitMediaTrack: track.mediaStreamTrack?.id || '',
    },
    element,
    play() {
      // Invoke play synchronously to retain the Safari user-gesture permission.
      // Direct calls never change the recording session while output is playing.
      if (!nativeOnly) routeOutput(output).catch(() => {});
      return element.play();
    },
    remove() {
      outputs.delete(output);
      track.detach(element);
      element.remove();
    },
    get muted() { return element.muted; },
    set muted(value) { element.muted = value; },
  };
  outputs.add(output);
  return output;
}

/**
 * Uzak eşin ses akışını yönlendirilebilir bir <audio> elementine bağlar.
 * createVoiceOutput ile aynı çıkış yönlendirmesini kullanır (iOS hoparlör/ahize).
 */
export function createStreamOutput(stream, roomId, { startMuted = false } = {}) {
  const element = new Audio();
  element.autoplay = true;
  element.playsInline = true;
  element.setAttribute('playsinline', 'true');
  element.muted = startMuted;
  element.setAttribute('webkit-playsinline', 'true');
  // iOS'ta "display:none" olan ses elementi çalmayabiliyor: görünmez ama ekran
  // içinde duran 1px'lik bir katman kullanılır.
  element.style.position = 'fixed';
  element.style.bottom = '0';
  element.style.left = '0';
  element.style.width = '1px';
  element.style.height = '1px';
  element.style.opacity = '0';
  element.style.pointerEvents = 'none';
  // iOS Safari akışı, element sayfaya eklendikten SONRA bağlamayı gerektirir:
  // ters sırada bağlanan uzak ses iOS cihazlarda hiç çalmıyordu.
  document.body.appendChild(element);
  // Eski iOS/Android: srcObject yoktur, akış nesne adresiyle bağlanır.
  let objectUrl = '';
  if ('srcObject' in element) {
    element.srcObject = stream;
  } else {
    try {
      objectUrl = (window.URL || window.webkitURL).createObjectURL(stream);
      element.src = objectUrl;
    } catch (error) {}
  }

  const output = {
    dataset: { voiceRoom: roomId, mediaId: stream.id },
    element,
    play() {
      routeOutput(output).catch(() => {});
      const playing = element.play();
      // Safari oynatmayı reddederse kendiliğinden yeniden denenir (ilk dokunuşta başlar).
      if (playing && typeof playing.catch === 'function') playing.catch(() => armAutoRetry());
      return playing;
    },
    remove() {
      outputs.delete(output);
      try { element.srcObject = null; } catch {}
      if (objectUrl) { try { (window.URL || window.webkitURL).revokeObjectURL(objectUrl); } catch {} }
      element.remove();
    },
    get muted() { return element.muted; },
    set muted(value) { element.muted = value; },
  };
  outputs.add(output);
  return output;
}

// --- Zil sesi (AudioContext yok: eski cihazlarda mikrofonu düşürmesin) ---

let ringElement = null;
let ringToneUrl = null;

/** 2 saniyelik "çift zil" tonunu WAV verisine çevirir. */
function ringToneDataUrl() {
  if (ringToneUrl) return ringToneUrl;
  const sampleRate = 8000;
  const total = sampleRate * 2;
  const bytes = new Uint8Array(44 + total);
  const view = new DataView(bytes.buffer);
  const write = (offset, text) => { for (let i = 0; i < text.length; i += 1) bytes[offset + i] = text.charCodeAt(i); };
  write(0, 'RIFF');
  view.setUint32(4, 36 + total, true);
  write(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  write(36, 'data');
  view.setUint32(40, total, true);
  for (let i = 0; i < total; i += 1) {
    const t = i / sampleRate;
    const inBeep = (t >= 0 && t < 0.45) || (t >= 0.5 && t < 0.95);
    const local = t < 0.5 ? t : t - 0.5;
    const fade = local < 0.04 ? local / 0.04 : local > 0.42 ? Math.max(0, (0.45 - local) / 0.03) : 1;
    const tone = inBeep ? Math.sin(2 * Math.PI * 420 * t) * fade : 0;
    bytes[44 + i] = 128 + Math.round(70 * tone);
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  ringToneUrl = `data:audio/wav;base64,${btoa(binary)}`;
  return ringToneUrl;
}

/** Zil oynatıcısı ilk kullanıcı dokunuşunda hazırlanır: iOS'ta otomatik oynatma kilidi açılır. */
function primeRingElement() {
  if (ringElement || typeof window === 'undefined') return ringElement;
  try {
    ringElement = new Audio(ringToneDataUrl());
    ringElement.loop = true;
    ringElement.volume = 0.45;
    ringElement.muted = true;
    ringElement.playsInline = true;
    ringElement.setAttribute('playsinline', 'true');
    ringElement.style.display = 'none';
    document.body.appendChild(ringElement);
    ringElement.play().then(() => {
      setTimeout(() => { ringElement.pause(); ringElement.currentTime = 0; }, 60);
    }).catch(() => {});
  } catch {
    ringElement = null;
  }
  return ringElement;
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', primeRingElement, { capture: true, passive: true });
  window.addEventListener('touchend', primeRingElement, { capture: true, passive: true });
}

let vibrateTimer = null;

/** Çalan telefon sesi — durdurma fonksiyonu döner. */
export function startRingtone() {
  stopActiveRingtone();
  const element = primeRingElement();
  let stopped = false;
  if (element) {
    try {
      element.currentTime = 0;
      element.muted = false;
      element.play().catch(() => {});
    } catch {}
  }
  const buzz = () => { navigator.vibrate?.([320, 160, 320]); };
  buzz();
  vibrateTimer = setInterval(buzz, 2000);

  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearInterval(vibrateTimer);
    vibrateTimer = null;
    navigator.vibrate?.(0);
    if (element) {
      try { element.pause(); element.currentTime = 0; element.muted = true; } catch {}
    }
    if (activeRingtone === stop) activeRingtone = null;
  };
  activeRingtone = stop;
  return stop;
}

let activeRingtone = null;

function stopActiveRingtone() {
  activeRingtone?.();
  activeRingtone = null;
}