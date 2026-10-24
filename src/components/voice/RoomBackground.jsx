import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Image } from '@/components/ui/image';

const THEME_IMAGE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/9ddc28102_generated_image.png';
const THEME_TINT = '#0a1230';

/** Sesli odanın zemini: tek sabit gece bahçesi teması. */
export default function RoomBackground() {
  const ref = useRef(null);

  useEffect(() => {
    const frame = ref.current?.closest('.voice-viewport');
    if (!frame) return undefined;
    const targets = [frame, document.documentElement];
    targets.forEach((node) => {
      node.style.setProperty('--room-theme-tint', THEME_TINT);
      node.style.setProperty('--room-theme-image', `url("${THEME_IMAGE}")`);
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
        <div className="absolute inset-0" style={{ background: THEME_TINT }} />
        <Image src={THEME_IMAGE} alt="" fittingType="fill" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    </>
  );
}