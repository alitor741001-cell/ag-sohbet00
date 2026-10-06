import { useCallback, useRef } from 'react';

// Kaydırma sayılması için gereken en kısa mesafe ve dikey baskınlık oranı:
// kısa dokunuşlar ve yatay hareketler yayın değiştirmez.
const MIN_DISTANCE = 90;
const DIRECTION_RATIO = 1.6;

/**
 * Dikey kaydırma yakalayıcı: içerik kendi sınırına gelene kadar normal kaydırılır,
 * sınırdayken yukarı/aşağı çekiş yayın değiştirir (TikTok akışı gibi).
 * Dokunmalar engellenmez: koltuklar ve düğmeler normal çalışır.
 */
export default function useVerticalSwipe({ enabled, onSwipeUp, onSwipeDown }) {
  const startRef = useRef(null);
  const scrollRef = useRef(null);

  const onTouchStart = useCallback((event) => {
    if (!enabled) return;
    const touch = event.touches[0];
    if (!touch) return;
    startRef.current = { x: touch.clientX, y: touch.clientY };
  }, [enabled]);

  const onTouchEnd = useCallback((event) => {
    if (!enabled || !startRef.current) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - startRef.current.x;
    const dy = touch.clientY - startRef.current.y;
    startRef.current = null;
    if (Math.abs(dy) < MIN_DISTANCE || Math.abs(dy) < Math.abs(dx) * DIRECTION_RATIO) return;
    // İçerik kaydırılabilir olduğunda önce içerik kaydırılır; yalnızca sınırdayken
    // bir sonraki/önceki yayına geçilir.
    const box = scrollRef.current;
    if (box) {
      const atTop = box.scrollTop <= 1;
      const atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 1;
      if (dy > 0 && !atTop) return;
      if (dy < 0 && !atBottom) return;
    }
    if (dy < 0) onSwipeUp?.();
    else onSwipeDown?.();
  }, [enabled, onSwipeUp, onSwipeDown]);

  return { scrollRef, handlers: { onTouchStart, onTouchEnd } };
}