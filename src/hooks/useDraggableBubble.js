import { useCallback, useEffect, useRef, useState } from 'react';

// Çemberin ölçüsü ve kenar boşluğu: denetleyici ekran dışına taşmaz.
const SIZE = 56;
const EDGE = 10;
// Alt sınır: kontrol çubuğu ile alt gezinme çubuğunun üstünde kalır.
const BOTTOM_RESERVE = 96;

/**
 * Ekranda parmakla gezdirilen katman (müzik çemberi ya da paneli). Konum cihazda saklanır,
 * her ekran ölçüsünde görünür alana çekilir ve sürükleme pencere olaylarıyla izlenir —
 * içindeki düğmelerin dokunuşları ve tıklamaları bozulmaz.
 * `measure`: katmanın kendi ölçüsü okunur (panel için), `detached`: taşınmadıysa yerleşim stille verilir.
 */
export default function useDraggableBubble(storageKey, options = {}) {
  const size = options.size || SIZE;
  const edge = options.edge || EDGE;
  const bottomReserve = options.bottomReserve ?? BOTTOM_RESERVE;
  const measure = !!options.measure;
  const detached = !!options.detached;

  const boxRef = useRef(null);
  const grabRef = useRef(null);
  const movedRef = useRef(false);
  const [pos, setPos] = useState(() => {
    let saved = null;
    try { saved = JSON.parse(window.localStorage.getItem(storageKey) || 'null'); } catch { saved = null; }
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) return saved;
    if (detached) return null;
    return { x: window.innerWidth - size - 16, y: window.innerHeight - size - 150 };
  });

  // Konum her ekran ölçüsünde görünür alanda kalır: döndürme, klavye ve farklı telefon boyutları.
  const clamp = useCallback((x, y) => {
    const rect = measure ? boxRef.current?.getBoundingClientRect() : null;
    const width = rect?.width || size;
    const height = rect?.height || size;
    return {
      x: Math.min(Math.max(x, edge), Math.max(edge, window.innerWidth - width - edge)),
      y: Math.min(Math.max(y, 60), Math.max(60, window.innerHeight - height - bottomReserve)),
    };
  }, [measure, size, edge, bottomReserve]);

  useEffect(() => {
    const reflow = () => setPos((current) => (current ? clamp(current.x, current.y) : current));
    reflow();
    window.addEventListener('resize', reflow);
    window.addEventListener('orientationchange', reflow);
    return () => {
      window.removeEventListener('resize', reflow);
      window.removeEventListener('orientationchange', reflow);
    };
  }, [clamp]);

  const onPointerDown = useCallback((event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    grabRef.current = {
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
    };
    movedRef.current = false;
    const onMove = (moveEvent) => {
      const grab = grabRef.current;
      if (!grab) return;
      // Küçük titremeler sürükleme sayılmaz: dokunma niyeti korunur.
      if (!movedRef.current && Math.abs(moveEvent.clientX - grab.startX) + Math.abs(moveEvent.clientY - grab.startY) < 6) return;
      movedRef.current = true;
      setPos(clamp(moveEvent.clientX - grab.dx, moveEvent.clientY - grab.dy));
    };
    const onUp = () => {
      grabRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }, [clamp]);

  // Konum saklanır: odaya yeniden girildiğinde denetleyici aynı yerde durur.
  useEffect(() => {
    if (!pos) return;
    window.localStorage.setItem(storageKey, JSON.stringify(pos));
  }, [pos, storageKey]);

  return { pos, boxRef, didDrag: () => movedRef.current, bind: { onPointerDown } };
}