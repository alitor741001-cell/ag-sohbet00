import { useRef } from 'react';

/**
 * Film alanının üzerindeki görünmez kaydırma katmanı.
 * YouTube oynatıcısı kendi çerçevesi (iframe) içinde çalıştığı için dokunma
 * olayları sayfaya ulaşmıyor; bu katman yatay kaydırmayı yakalar ve paneli açar.
 */
export default function StageSwipeLayer({ onSwipeLeft, onSwipeRight, className = '' }) {
  const start = useRef(null);

  const handleStart = (event) => {
    const touch = event.touches[0];
    start.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleEnd = (event) => {
    if (!start.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.current.x;
    const dy = touch.clientY - start.current.y;
    start.current = null;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) onSwipeLeft?.();
    else onSwipeRight?.();
  };

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-x-0 top-0 bottom-[5.5rem] z-[54] ${className}`}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
    />
  );
}