import { useLayoutEffect, useState } from 'react';

export default function useProfileSheetTop(enabled) {
  const [top, setTop] = useState(0);
  useLayoutEffect(() => {
    if (!enabled) return;
    const seats = document.querySelectorAll('.voice-viewport [data-seat-index]');
    const seat = document.querySelector('.voice-viewport [data-seat-index="6"]') || seats[seats.length - 1];
    // Kart ve dış çerçevesi, 7. koltuğun alt kenarında birlikte başlar.
    const measure = () => {
      const rect = seat?.getBoundingClientRect();
      const edge = rect ? rect.bottom : window.innerHeight * 0.6;
      setTop(Math.max(0, Math.min(edge, window.innerHeight - 120)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (seat) observer.observe(seat);
    const stage = document.querySelector('.voice-stage');
    if (stage) observer.observe(stage);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [enabled]);
  return top;
}