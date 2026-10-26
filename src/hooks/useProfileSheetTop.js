import { useLayoutEffect, useState } from 'react';

export default function useProfileSheetTop(enabled) {
  const [top, setTop] = useState(0);
  useLayoutEffect(() => {
    if (!enabled) return;
    const seats = document.querySelectorAll('.voice-viewport [data-seat-index]');
    const seat = document.querySelector('.voice-viewport [data-seat-index="4"]') || seats[seats.length - 1];
    // Kartın üst kenarı 5. koltuğun alt hizasından başlar: üstteki boşluk kırpılır,
    // profil resmi ve çemberi bir satır aşağı iner.
    const measure = () => {
      const rect = seat?.getBoundingClientRect();
      const edge = rect ? rect.bottom + 54 : window.innerHeight * 0.6;
      const lowest = Math.max(0, window.innerHeight - 340);
      setTop(Math.max(0, Math.min(edge, lowest)));
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