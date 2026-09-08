import { useEffect, useState } from 'react';
import { getFrameMetrics, getTransparentFrame, makeTransparentFrame } from '@/components/xp/frameTransparency';

// Ham görseli anında gösterir, arka planda işlenmiş versiyonu hazırlar.
// Çerçeve açılışta pop-in yapmaz — anında görünür.
export default function TransparentFrameImage({ src, animated, crop, onMetrics }) {
  const [transparentSrc, setTransparentSrc] = useState(() => getTransparentFrame(src, crop) || src);

  useEffect(() => {
    let active = true;
    const cached = getTransparentFrame(src, crop);
    if (cached) {
      setTransparentSrc(cached);
      onMetrics?.(getFrameMetrics(src, crop));
    } else {
      // Ham görseli anında göster — işlenmiş versiyon hazırlanınca değiştir
      setTransparentSrc(src);
      makeTransparentFrame(src, crop).then((url) => {
        if (!active) return;
        setTransparentSrc(url);
        onMetrics?.(getFrameMetrics(src, crop));
      }).catch(() => {});
    }
    return () => { active = false; };
  }, [src, crop, onMetrics]);

  return (
    <img
      src={transparentSrc}
      alt=""
      aria-hidden="true"
      className={`w-full h-full max-w-none object-contain overflow-visible ${animated ? 'xp-frame-asset' : ''}`}
    />
  );
}