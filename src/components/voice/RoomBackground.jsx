import { useEffect, useRef } from 'react';
import { Image } from '@/components/ui/image';
import { backgroundCss, backgroundOf } from '@/lib/roomBackgrounds';

/** Sesli odanın zemini: seçilen tema görseli, varsa oda kapak görseli. */
export default function RoomBackground({ value, cover }) {
  const ref = useRef(null);
  const tone = backgroundOf(value);

  // Tema aynı zamanda odanın kendi zeminine de yazılır: butonların altında kalan dolgu,
  // güvenli alan ve taşan bölgeler lacivert yerine temanın kendisiyle boyanır.
  useEffect(() => {
    const frame = ref.current?.closest('.voice-viewport');
    if (!frame) return undefined;
    frame.style.setProperty('--room-theme-tint', backgroundCss(value));
    frame.style.setProperty('--room-theme-image', tone?.image ? `url("${tone.image}")` : 'none');
    return () => {
      frame.style.removeProperty('--room-theme-tint');
      frame.style.removeProperty('--room-theme-image');
    };
  }, [value, tone?.image]);

  return (
    <div ref={ref} className="room-bg-layer" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: backgroundCss(value) }} />
      {tone?.image ? (
        <Image src={tone.image} alt="" fittingType="fill" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      {/* Tema görseli ekranın en altına kadar kesintisiz iner: altta koyu şerit kalmaz. */}
      {cover ? <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${cover})` }} /> : null}
    </div>
  );
}