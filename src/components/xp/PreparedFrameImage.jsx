import { useEffect, useState } from 'react';
import { getPreparedTransparent, makePreparedTransparent } from '@/components/xp/frameTransparency';

// Hazır çerçeveler için: açıklık koordinatlarını kullanarak orta daireyi şeffaf yapar.
// Ham görseli anında gösterir, arka planda işlenmiş versiyonu hazırlar ve hazır olunca değiştirir.
// Böylece çerçeve açılışta pop-in yapmaz — anında görünür.
export default function PreparedFrameImage({ src, opening, className = '' }) {
  const [transparentSrc, setTransparentSrc] = useState(() => getPreparedTransparent(src, opening) || src);

  useEffect(() => {
    let active = true;
    const cached = getPreparedTransparent(src, opening);
    if (cached) {
      setTransparentSrc(cached);
    } else {
      // Ham görseli anında göster — işlenmiş versiyon hazırlanınca değiştir
      setTransparentSrc(src);
      makePreparedTransparent(src, opening).then((url) => {
        if (active) setTransparentSrc(url);
      }).catch(() => {});
    }
    return () => { active = false; };
  }, [src, opening]);

  return (
    <img
      src={transparentSrc}
      alt=""
      aria-hidden="true"
      className={`pointer-events-none h-full w-full object-contain ${className}`}
    />
  );
}