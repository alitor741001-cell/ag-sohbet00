import { useEffect, useState } from 'react';

/** Sanal klavye açıldığında ekranın altından kapanan yüksekliği (px) verir. */
export default function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;

    const update = () => {
      const covered = window.innerHeight - viewport.height - viewport.offsetTop;
      const limit = Math.round(window.innerHeight * 0.7);
      setInset(covered > 24 ? Math.min(Math.round(covered), limit) : 0);
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
}