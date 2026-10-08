import { useEffect, useRef, useState } from 'react';
import { sekerliSound as gameSound } from '@/lib/sekerliAudio';
import { needleAngle } from './futbolConfig';

// İbre: ortadan hızlı döner, yavaşlar ve kazanan takımın hizasında durur.
const MAX_SPIN_MS = 4600;
const MIN_SPIN_MS = 1800;
// Durmadan önce atılan tam tur sayısı.
const TURNS = 4;

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Kazanan takımın çember üstündeki açısına tam turlar eklenir; dönüş hızlı başlar,
 * yavaşlar ve tam kazananın üstünde durur.
 */
export default function useNeedleSpin({ angle, active, remaining, sound }) {
  const [rotation, setRotation] = useState(0);
  const [landed, setLanded] = useState(false);
  const remainingRef = useRef(remaining);
  const soundRef = useRef(sound);
  remainingRef.current = remaining;
  soundRef.current = sound;

  useEffect(() => {
    setLanded(false);
    if (!active || angle === null || angle === undefined) {
      setRotation(0);
      return undefined;
    }

    const end = TURNS * 360 + needleAngle(angle);
    const duration = Math.min(MAX_SPIN_MS, Math.max(MIN_SPIN_MS, (remainingRef.current || MAX_SPIN_MS) - 900));
    const begin = performance.now();
    let frame = 0;
    let band = -1;

    const tick = (now) => {
      const progress = Math.min(1, (now - begin) / duration);
      const value = easeOut(progress) * end;
      setRotation(value);

      // İbre her takımın hizasından geçerken tık sesi verir.
      const current = Math.round(value / 45) % 8;
      if (current !== band) {
        band = current;
        if (soundRef.current) gameSound.stop(current);
      }

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }
      setRotation(end);
      setLanded(true);
      if (soundRef.current) gameSound.win(4);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, angle]);

  return { rotation, landed };
}