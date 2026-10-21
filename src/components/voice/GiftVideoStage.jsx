import { useEffect, useRef } from 'react';

/**
 * Hediye kaydında gerçek video dosyası (mp4/webm) varsa onu oynatır.
 * Video sessiz, döngüde ve satır içi oynar; üzerine film greni ve kenar karartması biner.
 */
export default function GiftVideoStage({ src, poster = '', color = '#facc15' }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.play().catch(() => {});
  }, [src]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={src}
        poster={poster || undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 gift-clip-grain opacity-[0.10] mix-blend-screen" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 48%, transparent 34%, ${color}22 62%, rgba(0,0,0,0.78) 100%)` }}
      />
      <div className="pointer-events-none absolute inset-0 gift-clip-flash" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[6vh] bg-gradient-to-b from-black/85 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[16vh] bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
    </div>
  );
}