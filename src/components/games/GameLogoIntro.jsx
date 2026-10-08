import React, { useEffect, useState } from 'react';
import '@/styles/gameLogoIntro.css';
import { Image } from '@/components/ui/image';

// Oyun açılışında logo ekranı kaplar; kısa süre sonra kendiliğinden kaybolur.
const INTRO_MS = 1500;

/** Tam ekran logo açılışı: oyun yüklenirken marka ekranı gösterilir. */
export default function GameLogoIntro({ src, originWidth, originHeight }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(false), INTRO_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!open) return null;

  return (
    <div className="glogo" role="presentation">
      <span className="glogo-halo" aria-hidden="true" />
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        className="glogo-mark"
        fittingType="fit"
        originWidth={originWidth}
        originHeight={originHeight}
        quality={92}
      />
    </div>
  );
}