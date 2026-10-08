import { useEffect, useRef, useState } from 'react';

/** Kazanç sayacı: değer değiştiğinde yumuşak şekilde hedefe doğru artar. */
export default function useCountUp(value, duration = 600) {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);

  useEffect(() => {
    const from = shownRef.current;
    if (from === value) return undefined;
    if (typeof requestAnimationFrame !== 'function') {
      shownRef.current = value;
      setShown(value);
      return undefined;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      const next = from + (value - from) * eased;
      shownRef.current = next;
      setShown(next);
      if (progress < 1) raf = requestAnimationFrame(tick);
      else {
        shownRef.current = value;
        setShown(value);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return shown;
}