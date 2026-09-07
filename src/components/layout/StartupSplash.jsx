import { useEffect, useState } from 'react';

const VIDEO_URL = 'https://media.base44.com/videos/public/6a77d66e4da6de214628ee62/108e8dbde_Al_Videosu.mp4';

export default function StartupSplash() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setExiting(true), 4500);
    const hideTimer = window.setTimeout(() => setVisible(false), 5000);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-[9999] bg-catalog transition-opacity duration-500 ${exiting ? 'opacity-0' : 'opacity-100'}`}>
      <video
        src={VIDEO_URL}
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-label="Sinematik film açılış videosu"
        className="h-full w-full object-cover"
      />
    </div>
  );
}