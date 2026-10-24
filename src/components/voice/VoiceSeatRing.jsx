import React from 'react';

/** Koltuk dairesi: süssüz, tam çember profil alanı. */
export default function VoiceSeatRing({ children, className = '' }) {
  return (
    <span className={`relative block shrink-0 rounded-full ${className}`}>
      <span className="relative block h-full w-full overflow-hidden rounded-full bg-[#08101d]" style={{ boxShadow: '0 0 0 1.5px #f2d79c, inset 0 2px 6px rgba(0,0,0,0.6)' }}>
        {children}
      </span>
    </span>
  );
}