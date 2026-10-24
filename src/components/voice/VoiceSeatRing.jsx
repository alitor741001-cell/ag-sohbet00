import React, { useEffect, useState } from 'react';
import { FRAME_COUNT, loadSeatFrames } from '@/components/voice/seatFrameSheet';

/** Koltuk çerçevesi: her koltuğa gönderilen tasarım sayfasından kendi çerçevesi. */
export default function VoiceSeatRing({ children, className = '', variant = 0 }) {
  const [frames, setFrames] = useState([]);
  useEffect(() => {
    let alive = true;
    loadSeatFrames().then((list) => alive && setFrames(list));
    return () => { alive = false; };
  }, []);
  const src = frames[Math.abs(variant) % FRAME_COUNT];

  return (
    <span className={`relative block shrink-0 rounded-full ${className}`}>
      <span className="relative block h-full w-full overflow-hidden rounded-full bg-[#08101d]">
        {children}
      </span>
      {src && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute select-none"
          style={{ left: '50%', top: '50%', width: '196%', height: '196%', maxWidth: 'none', transform: 'translate(-50%, -54%)' }}
        />
      )}
    </span>
  );
}