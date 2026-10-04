// Mikrofon kanalı bir kez açılır ve sekme açık kaldığı sürece yeniden kullanılır.
// Böylece film odası ↔ sesli sohbet geçişlerinde tarayıcı tekrar izin sormaz.
const RELEASE_MS = 30000;
const CONSTRAINTS = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };

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
    .getUserMedia({ audio: CONSTRAINTS })
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

/** Sohbetten çıkıldığında kanal kısa bir süre elde tutulur, sonra bırakılır. */
export function releaseSharedMic() {
  window.clearTimeout(releaseTimer);
  releaseTimer = window.setTimeout(() => {
    sharedTrack?.stop();
    sharedTrack = null;
  }, RELEASE_MS);
}