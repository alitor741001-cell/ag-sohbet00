import React from 'react';

const LAUNCH_VIDEO = 'https://media.base44.com/videos/public/6a77d66e4da6de214628ee62/171076feb_Roket_uuu.mp4';

export default function RocketLaunch({ onComplete }) {
  return <div className="rocket-launch-video-frame">
    <video
      src={LAUNCH_VIDEO}
      autoPlay muted playsInline controls preload="auto"
      className="h-full w-full object-contain"
      aria-label="Altın roketin ateşlenip uzaya yükseldiği ödül uçuşu"
      onEnded={onComplete}
      onError={onComplete}
    />
  </div>;
}