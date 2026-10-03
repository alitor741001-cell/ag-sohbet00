// Birebir arama ve oda sesi için tek ses motoru.
//
// Burada HİÇ AudioContext kullanılmaz. Eski iOS sürümlerinde çağrı sırasında
// açılan Web Audio, mikrofonu sessize düşürüyor (karşı taraf sesi duymuyordu) ve
// uzak sesi hoparlöre kilitliyordu. Uzak ses doğrudan <audio> elementinden
// çalınır; ahize/hoparlör seçimi iOS'ta navigator.audioSession, diğer
// cihazlarda setSinkId ile yapılır.

const MIC_OPTIONS = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
const EARPIECE_RE = /earpiece|receiver|handset|ahize|kulak|communication/i;

let micStream = null;
let micTrack = null;
let micPending = null;

let speakerOn = true;
const outputs = new Set();

function releaseMicStream() {
  try { micStream?.getTracks().forEach((track) => track.stop()); } catch {}
  micStream = null;
  micTrack = null;
}

async function acquireMic() {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('mikrofon desteklenmiyor');
  const next = await navigator.mediaDevices.getUserMedia({ audio: MIC_OPTIONS });
  const track = next.getAudioTracks()[0] || null;
  const stale = micStream;
  micStream = next;
  micTrack = track;
  if (track) track.addEventListener('ended', () => { if (micTrack === track) { micTrack = null; micStream = null; } });
  stale?.getTracks().forEach((oldTrack) => oldTrack.stop());
  return track;
}

/**
 * Oturumdaki mikrofon track'i.
 * fresh=true ile aramaya başlarken temiz bir akış alınır: eski iOS sürümlerinde
 * çağrıdan önce açılan akış sessiz kalabiliyor. İzin kullanıcı tarafından bir
 * kez verildiği için tarayıcı tekrar sormaz.
 */
export function ensureMicTrack({ fresh = false } = {}) {
  if (!fresh && micTrack && micTrack.readyState === 'live' && !micTrack.muted) return Promise.resolve(micTrack);
  if (!micPending) {
    micPending = acquireMic()
      .catch((error) => {
        if (micTrack && micTrack.readyState === 'live') return micTrack;
        throw error;
      })
      .finally(() => { micPending = null; });
  }
  return micPending;
}

/** Görüşme bitince mikrofonu serbest bırak: sonraki arama temiz bir akışla başlar. */
export function releaseMic() {
  releaseMicStream();
}

function retryPlayback() {
  outputs.forEach((output) => {
    if (output.element?.paused) output.element.play().catch(() => {});
  });
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
  try {
    session.type = speakerOn ? 'auto' : 'play-and-record';
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
  // iOS'ta oynatma kullanıcı dokunuşuyla kilidini açar; ilk dokunuşta dener.
  window.addEventListener('pointerdown', retryPlayback, { capture: true, passive: true });
  window.addEventListener('touchend', retryPlayback, { capture: true, passive: true });
}

/**
 * LiveKit track'ini yönlendirilebilir bir <audio> elementine bağlar.
 * Dönen nesne arayüz tarafında element gibi kullanılır (dataset, play, remove, muted).
 */
export function createVoiceOutput(track, roomId, { startMuted = false } = {}) {
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
    async play() {
      await routeOutput(output);
      await element.play();
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