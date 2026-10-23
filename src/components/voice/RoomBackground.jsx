import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Sesli odanın zemini: tema görseli yok, sadece düz koyu zemin.
const ROOM_TINT = 'linear-gradient(180deg, #0b1733 0%, #05070f 100%)';

/** Sesli odanın zemini: koltukların arkasında tema görseli kullanılmaz. */
export default function RoomBackground() {
  const ref = useRef(null);

  useEffect(() => {
    const frame = ref.current?.closest('.voice-viewport');
    if (!frame) return undefined;
    const targets = [frame, document.documentElement];
    targets.forEach((node) => {
      node.style.setProperty('--room-theme-tint', ROOM_TINT);
      node.style.setProperty('--room-theme-image', 'none');
    });
    return () => {
      targets.forEach((node) => {
        node.style.removeProperty('--room-theme-tint');
        node.style.removeProperty('--room-theme-image');
      });
    };
  }, []);

  return (
    <>
      {createPortal(<div className="room-theme-layer" aria-hidden="true" />, document.body)}
      <div ref={ref} className="room-bg-layer" aria-hidden="true">
        <div className="absolute inset-0" style={{ background: ROOM_TINT }} />
      </div>
    </>
  );
}