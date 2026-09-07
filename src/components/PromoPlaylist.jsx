import { useState } from 'react';

export default function PromoPlaylist({ clips, controls, className, muted = true }) {
  const [index, setIndex] = useState(0);

  if (!clips?.length) return null;

  const src = clips[index % clips.length];
  const isSingleClip = clips.length === 1;

  return (
    <video
      key={src}
      src={src}
      autoPlay
      muted={muted}
      loop={isSingleClip}
      controls={controls}
      playsInline
      preload="auto"
      className={className}
      onEnded={() => {
        if (!isSingleClip) setIndex((current) => (current + 1) % clips.length);
      }}
    />
  );
}