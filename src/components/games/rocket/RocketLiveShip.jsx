import React, { useEffect, useRef } from 'react';
import { Image } from '@/components/ui/image';
import { ROCKET_SHIP } from '../rocketAssets';
import { ROCKET_BASE } from './rocketConfig';

// Bekleme noktası, uçuş eğrisi ve roket boyu — tasarım pikselleri (828x1485).
const PAD = { x: 328, y: 1172 };
const CURVE = { cx: 404, cy: 928, ex: 902, ey: 348 };
const SHIP = 140;
// Tasarımdaki roket yatay durur: gövde sağa bakar, alev arkada kalır.
const REST_ROT = 90;
const CLIMB_ROT = 62;
const LEVEL_ROT = 88;
// Roket yaklaşık 9 saniyede ekrandan çıkar ve her saniye hızlanır.
const RAMP = 9;
const POWER = 1.35;
const VMAX = POWER / RAMP;
// Tasarımdaki duran roketi kapatan yumuşak kalkış ışığı: alt kenarı panel
// hizasında biter, yanlarda sönümlenir.
const COVER = {
  left: 202,
  top: 1076,
  width: 252,
  height: 136,
  background: 'linear-gradient(180deg, rgba(24,52,126,0) 0%, rgba(25,56,136,0.62) 24%, rgba(23,50,120,0.95) 48%, rgba(21,46,112,0.97) 100%)',
  maskImage: 'linear-gradient(90deg, transparent 0%, #000 15%, #000 85%, transparent 100%)',
  WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 15%, #000 85%, transparent 100%)',
};

// Uçuş süresi sunucu çarpanından okunur: animasyon ile oyun aynı saati izler.
const flightSeconds = (mult) => Math.log(Math.max(1, mult)) / Math.log(ROCKET_BASE);
const progressAt = (t) => Math.min(1, Math.pow(Math.max(0, t) / RAMP, POWER));
const speedAt = (t) => Math.min(1, ((POWER / RAMP) * Math.pow(Math.max(0.001, t) / RAMP, POWER - 1)) / VMAX);
const pointAt = (u) => {
  const iu = 1 - u;
  return {
    x: iu * iu * PAD.x + 2 * iu * u * CURVE.cx + u * u * CURVE.ex,
    y: iu * iu * PAD.y + 2 * iu * u * CURVE.cy + u * u * CURVE.ey,
  };
};

/** Uçuş sahnesi: geri sayım bitince motorlar ateşlenir, roket dönerek hızlanır. */
export default function RocketLiveShip({ phase, mult }) {
  const stateRef = useRef({ phase, mult });
  stateRef.current = { phase, mult };
  const shipRef = useRef(null);
  const flameRef = useRef(null);
  const glowRef = useRef(null);
  const trailA = useRef(null);
  const trailB = useRef(null);
  const trailC = useRef(null);

  // Konum, dönüş, alev ve izler tek döngüde yazılır: her karede React yeniden
  // çizilmez, yalnız stil değişir.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let smooth = 0;
    let prevPhase = stateRef.current.phase;
    const trails = [trailA, trailB, trailC];

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const { phase: current, mult: value } = stateRef.current;
      // Yeni tur başlarken mekik paddle anında döner: geriye uçma görüntüsü olmaz.
      if (prevPhase !== 'betting' && current === 'betting') smooth = 0;
      prevPhase = current;
      const flying = current === 'running' || current === 'crashed';
      const target = flying ? progressAt(flightSeconds(value)) : 0;
      // Hedefe yumuşak yaklaşır: yoklama adımları konumu sıçratmaz.
      smooth += (target - smooth) * Math.min(1, dt * 8);

      const idle = !flying;
      const t = RAMP * Math.pow(smooth, 1 / POWER);
      const point = pointAt(smooth);
      const bob = idle ? Math.sin(now / 620) * 3 : 0;
      const speed = idle ? 0 : speedAt(t);
      // Kalkışta dik duruştan tırmanış açısına geçer, sonra yatayda dengelenir.
      const tilt = idle ? 0 : Math.min(1, t / 0.55);
      const rot = idle
        ? REST_ROT
        : REST_ROT + (CLIMB_ROT + (LEVEL_ROT - CLIMB_ROT) * smooth - REST_ROT) * tilt;
      // Motor çalıştırma titremesi: yalnız kalkışın ilk yarım saniyesinde.
      let shakeX = 0;
      let shakeY = 0;
      if (current === 'running' && t < 0.5) {
        const amp = 3.6 * (1 - t / 0.5);
        shakeX = (Math.random() - 0.5) * amp;
        shakeY = (Math.random() - 0.5) * amp;
      }

      const ship = shipRef.current;
      if (ship) {
        ship.style.transform =
          `translate(${(point.x - SHIP / 2 + shakeX).toFixed(2)}px, ${(point.y - SHIP / 2 + bob + shakeY).toFixed(2)}px) rotate(${rot.toFixed(2)}deg)`;
      }

      // Alev: kalkışta hızla açılır, hız arttıkça uzar.
      const ignite = idle ? 0.42 : Math.min(1, 0.45 + t / 0.18);
      const flame = flameRef.current;
      if (flame) {
        flame.style.transform = `scaleY(${((0.5 + 2.2 * speed) * ignite).toFixed(3)})`;
        flame.style.opacity = (idle ? 0.5 : 0.55 + 0.45 * speed).toFixed(2);
      }
      const glow = glowRef.current;
      if (glow) glow.style.opacity = (idle ? 0.22 : 0.25 + 0.7 * speed).toFixed(2);

      const lengths = [34 + 210 * speed, 22 + 150 * speed, 16 + 108 * speed];
      const alphas = [0.6 * speed, 0.42 * speed, 0.28 * speed];
      trails.forEach((ref, index) => {
        const node = ref.current;
        if (!node) return;
        node.style.height = `${lengths[index].toFixed(0)}px`;
        node.style.opacity = alphas[index].toFixed(3);
      });
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const crash = phase === 'crashed' ? pointAt(progressAt(flightSeconds(mult))) : null;

  return (
    <>
      {/* Tasarımdaki duran roket kalkış ışığıyla kapanır: padda tek roket görünür. */}
      <span className="pointer-events-none absolute" style={COVER} />

      {phase !== 'crashed' && (
        <span
          ref={shipRef}
          className="pointer-events-none absolute left-0 top-0"
          style={{ width: SHIP, height: SHIP, willChange: 'transform' }}
        >
          <span ref={glowRef} className="rk-speed-glow" />
          <span ref={trailC} className="rk-trail" />
          <span ref={trailB} className="rk-trail rk-trail-mid" />
          <span ref={trailA} className="rk-trail rk-trail-near" />
          <span ref={flameRef} className="rk-flame">
            <span className="rk-flame-outer" />
            <span className="rk-flame-blue" />
            <span className="rk-flame-core" />
          </span>
          <span className={`absolute inset-0 ${phase === 'betting' ? 'rk-idle' : ''}`}>
            <Image
              src={ROCKET_SHIP}
              alt="Roket"
              fittingType="fit"
              className="h-full w-full object-contain"
            />
          </span>
        </span>
      )}

      {crash && (
        <span
          className="rk-burst pointer-events-none absolute"
          style={{ left: crash.x - 80, top: crash.y - 80, width: 160, height: 160 }}
        />
      )}
    </>
  );
}