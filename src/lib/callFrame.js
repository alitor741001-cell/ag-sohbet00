/**
 * Görüntülü aramada yayınlanan kamera yolundan tek bir kare yakalar.
 * Kare, çıplaklık denetimi için JPEG olarak yüklenir; cihazdan başka yere gitmez.
 */
export async function captureTrackFrame(track) {
  const media = track?.mediaStreamTrack;
  if (!media || media.readyState !== 'live') return null;

  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.srcObject = new MediaStream([media]);

  try {
    await video.play().catch(() => {});
    if (!video.videoWidth) {
      await new Promise((resolve) => {
        const done = () => resolve();
        video.onloadedmetadata = done;
        window.setTimeout(done, 500);
      });
    }
    if (!video.videoWidth) return null;

    const width = 360;
    const height = Math.max(1, Math.round((video.videoHeight / video.videoWidth) * width));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(video, 0, 0, width, height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.7));
    if (!blob) return null;
    return new File([blob], `frame-${Date.now()}.jpg`, { type: 'image/jpeg' });
  } finally {
    video.pause();
    video.srcObject = null;
  }
}