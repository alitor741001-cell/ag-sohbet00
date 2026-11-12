import { useRef } from 'react';
import { useSize } from '@/hooks/use-size';

/**
 * Koltuk düzeni sahneye sığmazsa bütün olarak küçültülür: dizilim aynı kalır, son satırın
 * isimleri ve sayı şeritleri kesilmez, koltuklar sohbet/tema alanının altına girmez.
 */
export default function FitSeatsToHeight({ maxHeight, children }) {
  const innerRef = useRef(null);
  const natural = useSize(innerRef);
  const height = natural?.height || 0;
  const scale = maxHeight && height > maxHeight ? Math.max(0.5, maxHeight / height) : 1;

  return (
    <div className="w-full" style={scale < 1 ? { height: height * scale } : undefined}>
      <div ref={innerRef} className="w-full" style={scale < 1 ? { transform: `scale(${scale})`, transformOrigin: 'top center' } : undefined}>
        {children}
      </div>
    </div>
  );
}