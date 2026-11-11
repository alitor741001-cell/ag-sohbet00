import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Image } from '@/components/ui/image';

import { backgroundOf, backgroundCss } from '@/lib/roomBackgrounds';
import PkThemeBackdrop from '@/components/voice/pk/PkThemeBackdrop';

/** Sesli odanın zemini: oda menüsünden seçilen tema. */
export default function RoomBackground({ value, cover, pk = false }) {
  const ref = useRef(null);
  const THEME_IMAGE = backgroundOf(value)?.image || cover || '';
  const THEME_TINT = backgroundCss(value);

  useEffect(() => {
    const frame = ref.current?.closest('.voice-viewport');
    if (!frame) return undefined;
    const targets = [frame, document.documentElement];
    targets.forEach((node) => {
      node.style.setProperty('--room-theme-tint', THEME_TINT);
      node.style.setProperty('--room-theme-image', THEME_IMAGE ? `url("${THEME_IMAGE}")` : 'none');
    });
    return () => {
      targets.forEach((node) => {
        node.style.removeProperty('--room-theme-tint');
        node.style.removeProperty('--room-theme-image');
      });
    };
  }, [THEME_IMAGE, THEME_TINT]);

  return (
    <>
      {createPortal(<div className="room-theme-layer" aria-hidden="true" />, document.body)}
      <div ref={ref} className="room-bg-layer" aria-hidden="true">
        <div className="absolute inset-0" style={{ background: THEME_TINT }} />
        {THEME_IMAGE && <Image src={THEME_IMAGE} alt="" fittingType="fill" className="absolute inset-0 h-full w-full object-cover" />}
        {/* PK açıkken tüm oda zemini AG logolu mavi-kırmızı PK temasına döner. */}
        {pk && <PkThemeBackdrop full />}
      </div>
    </>
  );
}