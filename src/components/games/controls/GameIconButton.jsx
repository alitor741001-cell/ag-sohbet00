import React from 'react';
import '@/styles/gameControls.css';

/** Elimin Slot'taki gibi küçük yuvarlak, altın çerçeveli simge düğmesi. */
export default function GameIconButton({ label, active = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`gctl-pill gctl-icon gctl-icon-sm ${active ? 'gctl-pill-on' : ''}`}
    >
      {children}
    </button>
  );
}