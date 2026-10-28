import { useEffect, useState } from 'react';

/**
 * Sohbet alanının üst kenarını verilen sıradaki koltuğun alt hizasına getirir:
 * sohbet, kontrol çubuğunun üstünden başlayıp hedef koltuğun bittiği yere kadar uzanır.
 * Hedef koltuk yoksa (az koltuklu odalar) boy hesaplanmaz, varsayılan yükseklik kalır.
 */
export default function useChatDockToSeat(dockRef, seatIndex = 6, seatCount = 0) {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const dock = dockRef.current;
    const root = dock?.closest('.voice-viewport');
    if (!dock || !root) return undefined;

    let frame = 0;
    let retry = 0;
    const measure = () => {
      frame = 0;
      const seat = root.querySelector(`[data-seat-index="${seatIndex}"]`);
      const controls = root.querySelector('.voice-controls-anchor');
      if (!seat || !controls) {
        // Koltuklar katılımdan sonra çizilir: kısa süre tekrar denenir.
        if (retry < 20) retry += 1;
        return;
      }
      const controlBox = controls.getBoundingClientRect();
      const seatBox = seat.getBoundingClientRect();
      if (!controlBox.height || !seatBox.height) return;
      const limit = root.getBoundingClientRect().height * 0.62;
      const next = Math.round(Math.min(controlBox.top - seatBox.bottom, limit));
      if (next < 96) return;
      setHeight((prev) => (Math.abs(prev - next) > 2 ? next : prev));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };

    schedule();
    const timer = setInterval(() => {
      if (retry >= 20) { clearInterval(timer); return; }
      schedule();
    }, 300);
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      clearInterval(timer);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [dockRef, seatIndex, seatCount]);

  return height;
}