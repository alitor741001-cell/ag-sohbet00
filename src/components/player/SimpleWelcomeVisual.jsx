import { useEffect, useState } from 'react';
import { Image } from '@/components/ui/image';

export default function SimpleWelcomeVisual({ src, alt, onDone }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setExiting(true), 4500);
    const doneTimer = setTimeout(() => onDone?.(), 5000);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div className={`pointer-events-none fixed inset-0 z-[90] flex items-start justify-center pt-[max(env(safe-area-inset-top),2.5rem)] transition-opacity duration-500 ${exiting ? 'opacity-0' : 'opacity-100'}`}>
      <div className="h-[95px] w-[95px] overflow-hidden rounded-full bg-black animate-slide-down">
        <Image src={src} alt={alt} className="h-full w-full" fittingType="fit" draggable={false} />
      </div>
    </div>
  );
}