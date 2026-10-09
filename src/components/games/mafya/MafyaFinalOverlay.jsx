import React from 'react';
import { Flame } from 'lucide-react';

/** SON 4: son dört oyuncu kaldığında ekrana gelen kısa gerilim anı. */
export default function MafyaFinalOverlay({ alive, onAccept }) {
  return (
    <div className="mf-overlay mf-final">
      <div className="flex flex-col items-center gap-2 text-center">
        <Flame className="h-9 w-9 text-[#ff2b2b]" aria-hidden="true" />
        <p className="mf-final-title">SON 4</p>
        <p className="mf-final-sub">Kim kazanacak?</p>
        <p className="mf-final-note">Kalan oyuncular: {alive.join(' · ')}</p>
        <button type="button" className="mf-btn mf-btn-red mt-2 px-6" onClick={onAccept}>
          Oyna ve gör!
        </button>
      </div>
    </div>
  );
}