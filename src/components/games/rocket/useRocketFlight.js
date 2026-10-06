import { useEffect, useRef, useState } from 'react';
import {
  FLIGHT_CURVE,
  IGNITION_S,
  flightAngle,
  flightDir,
  flightPoint,
  flightProgress,
  secondsForMult,
} from './rocketPath';

/**
 * Oyun akışı: COUNTDOWN (roket rampada bekler) → IGNITION (motor yanar, gövde
 * titrer, kısa bir dönüş yapar) → FLIGHT (önce ileri, sonra yukarı kıvrılan 2D
 * uçuş) → CASH_OUT (çekilen oyuncuların profilleri uçuş alanında sabitlenir)
 * → CRASH (hızlanıp ekran dışına fırlar) → GONE (yeni tur için temizlik).
 *
 * Konum, dönüş ve motor gücü her karede doğrudan DOM transformu ile yazılır:
 * React her karede yeniden çizmez, DOM'a yeni eleman eklenmez.
 */
const CRASH_MS = 800;
// Çakılınca uçuş yönünde ekran dışına fırlama mesafesi (sahne oranı).
const ESCAPE = 1.6;

export default function useRocketFlight({ phase, startedAt, crashMult, getNow, size, roundNo }) {
  const shipRef = useRef(null);
  const flameRef = useRef(null);
  const trailRef = useRef(null);
  const [state, setState] = useState('COUNTDOWN');
  const live = useRef({
    phase,
    startedAt,
    crashMult,
    size,
    state: 'COUNTDOWN',
    crashAt: 0,
    crashProgress: 0,
  });

  live.current.phase = phase;
  live.current.startedAt = startedAt;
  live.current.crashMult = crashMult;
  live.current.size = size;

  // Yeni tur: önceki turun patlama anı ve konumu sıfırlanır.
  useEffect(() => {
    live.current.crashAt = 0;
    live.current.crashProgress = 0;
    live.current.state = 'COUNTDOWN';
    setState('COUNTDOWN');
  }, [roundNo]);

  useEffect(() => {
    let raf = 0;
    const setIfChanged = (next) => {
      if (live.current.state !== next) {
        live.current.state = next;
        setState(next);
      }
    };

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const ship = shipRef.current;
      const { phase: gamePhase, startedAt: launchedAt, size: stage } = live.current;
      if (!ship || !stage?.width) return;

      const t = launchedAt ? (getNow() - launchedAt) / 1000 : -IGNITION_S;
      let x = 0;
      let y = 0;
      let angle = 0;
      let power = 0.14;

      if (gamePhase === 'crashed') {
        if (!live.current.crashAt) {
          live.current.crashAt = now;
          // Patlama, turun gerçek çakılma çarpanının uçuş konumunda olur:
          // yoklama gecikse bile roket ile patlama aynı noktada buluşur.
          const crash = live.current.crashMult || 1;
          live.current.crashProgress = flightProgress(secondsForMult(crash) - IGNITION_S);
        }
        const k = Math.min(1, (now - live.current.crashAt) / CRASH_MS);
        const progress = live.current.crashProgress;
        const base = flightPoint(progress);
        const dir = flightDir(progress, stage.width, stage.height);
        const away = Math.min(stage.width, stage.height) * ESCAPE * k * k;
        x = base.x * stage.width + dir.dx * away;
        y = base.y * stage.height + dir.dy * away;
        angle = flightAngle(progress, stage.width, stage.height);
        power = 1.6;
        ship.style.opacity = String(Math.max(0, 1 - k * 1.15));
        setIfChanged(k >= 1 ? 'GONE' : 'CRASH');
      } else if (gamePhase === 'running') {
        ship.style.opacity = '1';
        if (t < IGNITION_S) {
          // Yerinde hazırlık: motor yanar, gövde titrer, burun uçuş yönüne döner.
          const k = Math.max(0, Math.min(1, t / IGNITION_S));
          const spot = FLIGHT_CURVE.start;
          const launchAngle = flightAngle(0, stage.width, stage.height);
          x = spot.x * stage.width + Math.sin(now / 24) * 2.6 * (1 - k * 0.4);
          y = spot.y * stage.height + Math.cos(now / 29) * 2 * (1 - k * 0.4);
          angle = launchAngle * k + Math.sin(k * Math.PI * 2.5) * 20 * (1 - k * 0.6);
          power = 0.35 + 0.75 * k;
          setIfChanged('IGNITION');
        } else {
          const progress = flightProgress(t - IGNITION_S);
          const point = flightPoint(progress);
          x = point.x * stage.width;
          y = point.y * stage.height;
          angle = flightAngle(progress, stage.width, stage.height);
          power = 0.45 + 0.75 * progress;
          setIfChanged('FLIGHT');
        }
      } else {
        // Bahis aşaması: roket kalkış noktasında hafifçe süzülür.
        const spot = FLIGHT_CURVE.start;
        x = spot.x * stage.width + Math.sin(now / 900) * 1.8;
        y = spot.y * stage.height + Math.sin(now / 620) * 3.4;
        angle = Math.sin(now / 1100) * 3;
        power = 0.14;
        ship.style.opacity = '1';
        setIfChanged('COUNTDOWN');
      }

      ship.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${angle.toFixed(2)}deg) translate(-50%, -50%)`;

      if (flameRef.current) {
        flameRef.current.style.opacity = String(Math.min(1, 0.2 + power * 0.8));
        flameRef.current.style.transform = `translateX(-50%) scaleX(${(0.8 + power * 0.3).toFixed(3)}) scaleY(${(0.55 + power).toFixed(3)})`;
      }
      if (trailRef.current) {
        trailRef.current.style.opacity = String(Math.max(0, Math.min(0.8, (power - 0.4) * 1.4)));
        trailRef.current.style.transform = `translateX(-50%) scaleY(${(0.7 + power * 1.4).toFixed(3)})`;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getNow]);

  return { shipRef, flameRef, trailRef, state };
}