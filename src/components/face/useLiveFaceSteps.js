import { useEffect, useRef, useState } from 'react';
import checkFaceStep from '@/components/face/checkFaceStep';

export default function useLiveFaceSteps({ active, steps, index, capture, accept, feedback }) {
  const [checking, setChecking] = useState(false);
  const [rejected, setRejected] = useState(false);
  const inFlight = useRef(false);
  const checks = useRef(0);
  useEffect(() => {
    if (!active) return undefined;
    let alive = true;
    let timer;
    setRejected(false);
    const inspect = async () => {
      if (!alive) return;
      if (inFlight.current) { timer = setTimeout(inspect, 250); return; }
      if (checks.current >= 40) { feedback('Kontrol sınırına ulaşıldı. Lütfen kapatıp daha sonra tekrar deneyin.'); return; }
      inFlight.current = true;
      setChecking(true);
      try {
        const file = await capture();
        if (!alive) return;
        if (!file) throw new Error('Kamera görüntüsü alınamadı.');
        checks.current += 1;
        const result = await checkFaceStep(steps[index].key, file);
        if (!alive) return;
        if (result?.ok === true) {
          setRejected(false);
          feedback('');
          accept(file);
          return;
        }
        setRejected(true);
        feedback(result?.error || 'İstenen hareket algılanmadı. ' + steps[index].hint);
        if (result?.reason === 'busy') return;
      } catch (error) {
        if (alive) { setRejected(true); feedback(error?.message || 'Görüntü kontrol edilemedi.'); }
      } finally {
        inFlight.current = false;
        if (alive) setChecking(false);
      }
      if (alive) timer = setTimeout(inspect, 900);
    };
    timer = setTimeout(inspect, 400);
    return () => { alive = false; clearTimeout(timer); };
  }, [active, steps, index, capture, accept, feedback]);
  return { checking, rejected };
}