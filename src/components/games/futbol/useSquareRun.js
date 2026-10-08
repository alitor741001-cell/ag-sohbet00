import { useEffect, useRef, useState } from 'react';
import { sekerliSound as gameSound } from '@/lib/sekerliAudio';

// Çekiliş karesi: önce sahanın ortasında (kale önünde) hızlı döner, dönüşü
// yavaşlar, kartların üstünde akar ve bir takımın üstünde durur.
const MAX_RUN_MS = 4200;
const MIN_RUN_MS = 1400;
const LOOPS = 4;
// Ortadaki dönüş süresi ve toplam tur sayısı: son turda düz durur.
const SPIN_MS = 1100;
const TURNS = 5;

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const lerp = (from, to, ratio) => from + (to - from) * ratio;

/** Kartların saha içindeki merkez ve ölçülerini toplar. */
function measure(container) {
  const base = container.getBoundingClientRect();
  return [...container.querySelectorAll('[data-team-card]')].map((card) => {
    const rect = card.getBoundingClientRect();
    return {
      id: card.dataset.teamCard,
      left: rect.left - base.left + rect.width / 2,
      top: rect.top - base.top + rect.height / 2,
      width: rect.width,
      height: rect.height,
    };
  });
}

export default function useSquareRun({ containerRef, winner, active, remaining, sound }) {
  const [square, setSquare] = useState(null);
  const [landed, setLanded] = useState(false);
  const remainingRef = useRef(remaining);
  const soundRef = useRef(sound);
  remainingRef.current = remaining;
  soundRef.current = sound;

  useEffect(() => {
    const container = containerRef.current;
    setLanded(false);
    setSquare(null);
    if (!active || !winner || !container) return undefined;

    const spots = measure(container);
    const target = spots.find((spot) => spot.id === winner);
    if (!target || spots.length < 2) return undefined;

    // Yol: kazananın hizasından başlar, kartların üstünde tur atar ve kazananda biter.
    const path = [];
    for (let loop = 0; loop <= LOOPS; loop += 1) path.push(...spots);
    path.push(target);

    const start = spots.findIndex((spot) => spot.id === winner);
    const run = path.slice(start);
    const duration = Math.min(MAX_RUN_MS, Math.max(MIN_RUN_MS, (remainingRef.current || MAX_RUN_MS) - 600));
    const centre = { left: container.clientWidth / 2, top: container.clientHeight / 2 };
    const begin = performance.now();
    const total = SPIN_MS + duration;
    let frame = 0;
    let step = -1;

    const tick = (now) => {
      const elapsed = now - begin;
      // Dönüş hızlı başlar ve yavaşlayarak durur.
      const rotate = easeOut(Math.min(1, elapsed / total)) * TURNS * 360;
      // Koşu, ortadaki dönüşten sonra başlar.
      const progress = Math.min(1, Math.max(0, (elapsed - SPIN_MS) / duration));
      const position = easeInOut(progress) * (run.length - 1);
      const index = Math.min(run.length - 2, Math.floor(position));
      const ratio = position - index;
      const from = index === 0 ? centre : run[index];
      const to = run[index + 1];

      setSquare({
        left: lerp(from.left, to.left, ratio),
        top: lerp(from.top, to.top, ratio),
        width: lerp(from.width || to.width, to.width, ratio),
        height: lerp(from.height || to.height, to.height, ratio),
        rotate,
        done: false,
      });

      if (index !== step) {
        step = index;
        if (soundRef.current) gameSound.stop(index % 8);
      }

      if (elapsed < total) {
        frame = requestAnimationFrame(tick);
        return;
      }
      setSquare({ ...target, rotate: TURNS * 360, done: true });
      setLanded(true);
      if (soundRef.current) gameSound.win(4);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, containerRef, winner]);

  return { square, landed };
}