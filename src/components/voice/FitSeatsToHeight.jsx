import { useRef } from 'react';
import { useSize } from '@/hooks/use-size';

/**
 * Koltuk düzeni sahneye sığmazsa bütün olarak küçültülür: dizilim aynı kalır, son satırın
 * isimleri ve sayı şeritleri kesilmez, koltuklar sohbet/tema alanının altına girmez.
 */
export default function FitSeatsToHeight({ maxHeight, children }) {
  const innerRef = useRef(null);
  const natural = useSize(innerRef);
  // Offset ölçüsü transformdan etkilenmez; ilk ölçüm ile observer aynı geometridedir.
  const height = innerRef.current?.offsetHeight || natural?.height || 0;
  const scale = maxHeight > 0 && height > 0 ? Math.min(1, Math.max(1, maxHeight - 8) / height) : 1;

  return (
    <div className="w-full" style={scale < 1 ? { height: height * scale } : undefined}>
      <div ref={innerRef} className="w-full" style={scale < 1 ? { transform: `scale(${scale})`, transformOrigin: 'top center' } : undefined}>
        {children}
      </div>
    </div>
  );
}