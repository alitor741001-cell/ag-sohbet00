import { useLayoutEffect, useState } from 'react';

export default function useProfileSheetTop(enabled) {
  const [top, setTop] = useState(0);
  useLayoutEffect(() => {
    if (!enabled) return;
    const seats = document.querySelectorAll('.voice-viewport [data-seat-index]');
    const seat = document.querySelector('.voice-viewport [data-seat-index="4"]') || seats[seats.length - 1];
    const measure = () => setTop(Math.max(0, seat ? seat.getBoundingClientRect().top : window.innerHeight * 0.4));
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