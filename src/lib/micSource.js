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
  if (!supportsMicNoiseSuppression()) throw new Error('Bu tarayıcı gürültü engellemeyi desteklemiyor.');
  const track = sharedTrack || (acquiring ? await acquiring : null);
  if (track?.readyState === 'live') await track.applyConstraints(noiseConstraints(enabled));
  localStorage.setItem(NOISE_KEY, enabled ? 'on' : 'off');
}

let sharedTrack = null;
let acquiring = null;
let releaseTimer = null;

/** İzinli mikrofon kanalı: varsa aynısı döner, yoksa bir kez izin istenir. */
export async function sharedMicTrack() {
  window.clearTimeout(releaseTimer);
  releaseTimer = null;
  if (sharedTrack && sharedTrack.readyState === 'live') return sharedTrack;
  if (acquiring) return acquiring;
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