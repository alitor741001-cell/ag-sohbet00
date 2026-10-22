import { useEffect, useId, useRef } from 'react';
import GiftTransparencyFilter from '@/components/voice/GiftTransparencyFilter';

/**
 * Hediye kaydında gerçek video dosyası (mp4/webm) varsa onu oynatır.
 * Siyah zemin filtrelenir; %60 opaklıkla koltuklar videonun arkasında görünür.
 */
export default function GiftVideoStage({ src, poster = '', color = '#facc15' }) {
  const videoRef = useRef(null);
  const filterId = `gift-video-${useId().replace(/:/g, '')}`;

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
    <div className="absolute inset-0 overflow-hidden">
      <GiftTransparencyFilter id={filterId} />
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
        className="h-full w-full object-contain opacity-60"
        style={{ filter: `url(#${filterId})` }}
      />

    </div>
  );
}