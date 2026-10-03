// Uygulama oturumu boyunca tek mikrofon akışı.
// İlk aramada izin bir kez istenir; uygulamadan çıkılmadığı sürece
// sonraki aramalarda tarayıcı yeniden izin sormaz. Sessize alma da
// bu yüzden anında çalışır: yayın kapatılmaz, track duraklatılır.
const MIC_OPTIONS = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };

let stream = null;
let track = null;
let pending = null;

/** Oturumdaki mikrofon track'ini döner; yoksa (tek seferlik) izin ister. */
export async function ensureMicTrack() {
  if (track && track.readyState === 'live') return track;
  if (!pending) {
    pending = navigator.mediaDevices
      .getUserMedia({ audio: MIC_OPTIONS })
      .then((next) => {
        stream = next;
        track = next.getAudioTracks()[0] || null;
        track?.addEventListener('ended', () => { track = null; stream = null; });
        return track;
      })
      .finally(() => { pending = null; });
  }
  return pending;
}