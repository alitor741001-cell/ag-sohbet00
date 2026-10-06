import { useCallback, useEffect, useRef, useState } from 'react';

// Çemberin ölçüsü ve kenar boşluğu: balon ekran dışına taşmaz.
const SIZE = 56;
const EDGE = 10;
// Alt sınır: kontrol çubuğu ile alt gezinme çubuğunun üstünde kalır.
const BOTTOM_RESERVE = 96;

/** Balonu ekran sınırları içine çeker. */
const clamp = (x, y) => ({
  x: Math.min(Math.max(x, EDGE), Math.max(EDGE, window.innerWidth - SIZE - EDGE)),
  y: Math.min(Math.max(y, 60), Math.max(60, window.innerHeight - SIZE - BOTTOM_RESERVE)),
});

/**
 * Köşede duran yuvarlak düğme: parmakla ekranda gezdirilir ve konum cihazda hatırlanır.
 * Küçük hareketler dokunuş sayılır, sürüklerken açılmaz.
 */
export default function useDraggableBubble(storageKey) {
  const [pos, setPos] = useState(() => {
    let saved = null;
    try { saved = JSON.parse(window.localStorage.getItem(storageKey) || 'null'); } catch { saved = null; }
    const base = saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)
      ? saved
      : { x: window.innerWidth - SIZE - 16, y: window.innerHeight - SIZE - 150 };
    return clamp(base.x, base.y);
  });
  const grabRef = useRef(null);
  const movedRef = useRef(false);

  const onPointerDown = useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    grabRef.current = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };
    movedRef.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event) => {
    if (!grabRef.current) return;
    movedRef.current = true;
    setPos(clamp(event.clientX - grabRef.current.dx, event.clientY - grabRef.current.dy));
  }, []);

  const onPointerUp = useCallback((event) => {
    if (!grabRef.current) return;
    grabRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }, []);

  // Konum saklanır: odaya yeniden girildiğinde balon aynı yerde durur.
  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(pos));
  }, [pos, storageKey]);

  // Ekran ölçüsü değişirse balon görünür alana çekilir.
  useEffect(() => {
    const onResize = () => setPos((current) => clamp(current.x, current.y));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return { pos, didDrag: () => movedRef.current, bind: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp } };
}