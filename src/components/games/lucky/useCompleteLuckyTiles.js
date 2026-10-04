import { useLayoutEffect } from 'react';

// A moving symbol is shown only while its entire artwork fits inside the reel.
export default function useCompleteLuckyTiles(stripRef, spinning, finish, duration) {
  useLayoutEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    let frame;
    const started = performance.now();
    const update = () => {
      const viewport = strip.parentElement.getBoundingClientRect();
      for (const tile of strip.children) {
        const artwork = tile.firstElementChild;
        if (!artwork) continue;
        const bounds = artwork.getBoundingClientRect();
        tile.style.visibility = bounds.top >= viewport.top - 0.5 && bounds.bottom <= viewport.bottom + 0.5
          ? 'visible' : 'hidden';
      }
      if (spinning || performance.now() - started <= duration + 80) {
        frame = requestAnimationFrame(update);
      }
    };
    update();
    return () => cancelAnimationFrame(frame);
  }, [stripRef, spinning, finish, duration]);
}