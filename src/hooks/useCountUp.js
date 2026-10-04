import { useEffect, useRef, useState } from 'react';

/** Değer değişince eski değerden yeni değere doğru ileri sayan sınırsız sayaç. */
export default function useCountUp(target, duration = 600) {
  const value = Number(target) || 0;
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return undefined;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const next = Math.round(from + (value - from) * progress);
      fromRef.current = next;
      setDisplay(next);
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return display;
}