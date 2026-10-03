import { useEffect, useRef } from 'react';

/**
 * LiveKit video track'ini bir <video> elemanına bağlar.
 * Ses ayrı <audio> çıkışından geldiği için eleman her zaman sessizdir:
 * iOS'ta otomatik oynatma kilidi bu şekilde açılmaz.
 */
export default function CallVideoTile({ track, mirror = false, className = '' }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !track) return;
    track.attach(element);
    element.play?.().catch(() => {});
    return () => { try { track.detach(element); } catch {} };
  }, [track]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={className}
      style={mirror ? { transform: 'scaleX(-1)' } : undefined}
    />
  );
}