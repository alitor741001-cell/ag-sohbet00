// Birebir arama ve oda sesi için tek ses motoru.
//
// UZAK SES WEB AUDIO ÜZERİNDEN GEÇMEZ: iOS'ta açılan bir AudioContext sayfanın
// ses oturumunu "playback" (hoparlör) kategorisine kilitler; bu yüzden "ahize"
// modunda ses kulağa değil hoparlöre gidiyordu. Burada uzak ses doğrudan bir
// <audio> elementinden çalınır, yönlendirme iOS'ta navigator.audioSession ile
// (playback = hoparlör, play-and-record = ahize), diğer cihazlarda setSinkId
// ile yapılır.

const MIC_OPTIONS = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
const EARPIECE_RE = /earpiece|receiver|handset|ahize|kulak|communication/i;

let micStream = null;
let micTrack = null;
let micPending = null;

let speakerOn = true;
const outputs = new Set();

/** Oturumdaki mikrofon track'i — izin ilk aramada bir kez istenir. */
export async function ensureMicTrack() {
  if (micTrack && micTrack.readyState === 'live') return micTrack;
  if (!micPending) {
    micPending = navigator.mediaDevices
      .getUserMedia({ audio: MIC_OPTIONS })
      .then((next) => {
        micStream = next;
        micTrack = next.getAudioTracks()[0] || null;
        micTrack?.addEventListener('ended', () => { micTrack = null; micStream = null; });
        return micTrack;
      })
      .finally(() => { micPending = null; });
  }
  return micPending;
}

function retryPlayback() {
  outputs.forEach((output) => {
    if (output.element?.paused) output.element.play().catch(() => {});
  });
}

/** Arayüz uyumluluğu: Web Audio açılmadığı için yalnızca bekleyen oynatmayı dener. */
export function unlockVoicePlayback() {
  retryPlayback();
  return Promise.resolve(true);
}

// --- Çıkış yönlendirmesi: hoparlör / ahize ---

function audioSession() {
  return typeof navigator !== 'undefined' ? navigator.audioSession : null;
}

function applySessionType() {
  const session = audioSession();
  if (!session) return false;
  try {
    session.type = speakerOn ? 'playback' : 'play-and-record';
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

export function stopAllOutputs() {
  outputs.forEach((output) => output.remove());
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

// --- Zil sesi ---

let ringContext = null;
let activeRingtone = null;

/**
 * Çalan telefon sesi. Zil, kendi AudioContext'ini kullanır ve durdurulduğunda
 * kapatılır: böylece çağrı sesi hoparlöre kilitlenmez.
 */
export function startRingtone({ freq = 880, interval = 2000 } = {}) {
  activeRingtone?.();
  const Ctor = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
  if (!Ctor) return () => {};
  try { ringContext = new Ctor(); } catch { ringContext = null; return () => {}; }
  const context = ringContext;
  let stopped = false;
  let timer = null;

  const beep = (offset) => {
    if (stopped) return;
    const startAt = context.currentTime + offset;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.2, startAt + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.4);
    osc.connect(gain).connect(context.destination);
    osc.start(startAt);
    osc.stop(startAt + 0.45);
  };

  const pattern = () => {
    if (stopped) return;
    context.resume?.().catch(() => {});
    beep(0);
    beep(0.5);
    if (navigator.vibrate) navigator.vibrate([320, 160, 320]);
  };

  pattern();
  timer = setInterval(pattern, interval);

  const stop = () => {
    stopped = true;
    clearInterval(timer);
    if (navigator.vibrate) navigator.vibrate(0);
    try { context.close(); } catch {}
    if (ringContext === context) ringContext = null;
    if (activeRingtone === stop) activeRingtone = null;
  };
  activeRingtone = stop;
  return stop;
}