import { useEffect, useRef } from 'react';

/**
 * Hediye kaydında gerçek video dosyası (mp4/webm) varsa onu oynatır.
 * Siyah pikseller screen harmanlamasıyla görünmez; %30 opaklık koltukları açık bırakır.
 * Video üzerinde SVG filtresi kullanılmaz: mobil video katmanında siyah kutu oluşturabilir.
 */
export default function GiftVideoStage({ src, poster = '', color = '#facc15' }) {
  const videoRef = useRef(null);


  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const syncPlayback = () => {
      if (document.visibilityState === 'hidden') el.pause();
      else el.play().catch(() => {});
    };
    syncPlayback();
    document.addEventListener('visibilitychange', syncPlayback);
    return () => { document.removeEventListener('visibilitychange', syncPlayback); el.pause(); };
  }, [src]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-transparent mix-blend-screen">
      <video
        key={src}
        ref={videoRef}
        aria-label="Hediye animasyonu videosu"
        src={src}
        poster={poster || undefined}
        autoPlay
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          if (Number.isFinite(video.duration) && video.duration > 0) video.playbackRate = video.duration / 10;
        }}
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        className="h-full w-full bg-transparent object-contain opacity-75"
        style={{ filter: 'brightness(0.85) saturate(0.92)' }}

      />

    </div>
  );
}