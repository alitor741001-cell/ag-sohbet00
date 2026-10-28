// Mikrofon kanalı bir kez açılır ve sekme açık kaldığı sürece yeniden kullanılır.
// Böylece film odası ↔ sesli sohbet geçişlerinde tarayıcı tekrar izin sormaz.
const RELEASE_MS = 30000;
// Yankı önleme tek kanal yakalamada daha iyi çalışır: film sesi ve konuşma mikrofona kaçmaz.
const CONSTRAINTS = { echoCancellation: true, channelCount: { ideal: 1 } };
const NOISE_KEY = 'ag_voice_noise_suppression';
export const getMicNoiseSuppression = () => localStorage.getItem(NOISE_KEY) !== 'off';
export const supportsMicNoiseSuppression = () => Boolean(navigator.mediaDevices?.getSupportedConstraints?.().noiseSuppression);
const noiseConstraints = (enabled) => ({ ...CONSTRAINTS, noiseSuppression: enabled, autoGainControl: !enabled });

/** Mevcut yayını kesmeden mikrofon işlemesini güncelle; sonraki odalarda da koru. */
export async function setMicNoiseSuppression(enabled) {
  localStorage.setItem(NOISE_KEY, enabled ? 'on' : 'off');
  const track = roomTrack?.readyState === 'live' ? roomTrack : sharedTrack || (acquiring ? await acquiring : null);
  if (!track || track.readyState !== 'live' || !track.applyConstraints) return;
  try {
    await track.applyConstraints({ noiseSuppression: enabled });
  } catch {
    // Kısıtı desteklemeyen cihazlarda ayar bir sonraki mikrofon açılışında uygulanır.
  }
}

let roomTrack = null;
export const registerRoomMicTrack = track => { roomTrack = track; };
let sharedTrack = null;
let acquiring = null;
let releaseTimer = null;

/** İzinli mikrofon kanalı: varsa aynısı döner, yoksa bir kez izin istenir. */
export async function sharedMicTrack({ fresh = false } = {}) {
  window.clearTimeout(releaseTimer);
  releaseTimer = null;
  if (!fresh && sharedTrack && sharedTrack.readyState === 'live' && !sharedTrack.muted) return sharedTrack;
  if (acquiring) return acquiring;
  sharedTrack?.stop();
  sharedTrack = null;
  acquiring = navigator.mediaDevices
    .getUserMedia({ audio: noiseConstraints(getMicNoiseSuppression()) })
    .then((stream) => {
      sharedTrack = stream.getAudioTracks()[0] || null;
      acquiring = null;
      return sharedTrack;
    })
    .catch((error) => {
      acquiring = null;
      sharedTrack = null;
      throw error;
    });
  return acquiring;
}

export const hasSharedMic = () => !!sharedTrack && sharedTrack.readyState === 'live';

/** Kanala dokunmadan sesi kes/aç — izin ve kanal korunur, ses yakalanmaz. */
export function setSharedMicActive(active) {
  if (active) {
    window.clearTimeout(releaseTimer);
    releaseTimer = null;
  }
  if (sharedTrack && sharedTrack.readyState === 'live') sharedTrack.enabled = !!active;
}

/** Sohbetten çıkıldığında kanal kısa bir süre elde tutulur, sonra bırakılır. */
export function releaseSharedMic() {
  window.clearTimeout(releaseTimer);
  releaseTimer = window.setTimeout(() => {
    sharedTrack?.stop();
    sharedTrack = null;
  }, RELEASE_MS);
}