import { useEffect, useRef, useState } from 'react';

export default function useDedeStaffPlayback(strike) {
  const videoRef = useRef(null), canvasRef = useRef(null), latest = useRef(strike);
  const [failed, setFailed] = useState(false);
  latest.current = strike;
  useEffect(() => {
    const video = videoRef.current, canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let frame, alive = true;
    const draw = () => {
      if (video.readyState < 2) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height), p = image.data;
      for (let i = 0; i < p.length; i += 4) {
        const excess = p[i + 1] - Math.max(p[i], p[i + 2]);
        if (excess > 35) {
          p[i + 3] = Math.round(255 * Math.max(0, 1 - (excess - 35) / 65));
          p[i + 1] = Math.min(p[i + 1], Math.max(p[i], p[i + 2]) + 15);
        }
      }
      ctx.putImageData(image, 0, 0);
    };
    const tick = () => {
      draw();
      if (video.currentTime >= 5) video.pause();
      if (!video.paused) frame = requestAnimationFrame(tick);
    };
    const play = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(tick); };
    const ready = () => {
      video.currentTime = 3;
      if (latest.current) video.play().catch(() => alive && setFailed(true));
    };
    video.addEventListener('loadeddata', ready);
    video.addEventListener('seeked', draw);
    video.addEventListener('play', play);
    return () => {
      alive = false; cancelAnimationFrame(frame); video.pause();
      video.removeEventListener('loadeddata', ready); video.removeEventListener('seeked', draw); video.removeEventListener('play', play);
    };
  }, []);
  useEffect(() => {
    const video = videoRef.current;
    if (!strike || video.readyState < 2) return;
    video.currentTime = 3;
    video.play().catch(() => setFailed(true));
  }, [strike]);
  return { videoRef, canvasRef, failed, onError: () => setFailed(true) };
}