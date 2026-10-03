import React, { useRef } from 'react';
import { useSize } from '@/hooks/use-size';
import { ROCKET_SHIP } from '../rocketAssets';
import { flightAngle, flightPoint } from './rocketPath';

/**
 * Uçuş sahnesi: mekik çarpan büyüdükçe kavisli yolda sağ-yukarı süzülür,
 * gövdesi uçuş yönüne döner, motor parlaması ve hız çizgileri hızlanır.
 */
export default function RocketTrail({ progress, phase }) {
  const ref = useRef(null);
  const size = useSize(ref);
  const width = size?.width || 0;
  const height = size?.height || 0;

  const point = flightPoint(progress);
  const angle = width && height ? flightAngle(progress, width, height) : 0;
  const flying = phase === 'running';

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
      >
        <div className={`rk-engine-glow h-24 w-24 rounded-full ${flying ? 'rk-engine' : ''}`} />
      </div>

      {flying && <div className="rk-streak absolute inset-0" />}

      <img
        src={ROCKET_SHIP}
        alt=""
        className={`rk-ship absolute w-[30%] max-w-[9rem] ${flying ? 'rk-engine' : ''}`}
        style={{
          left: `${point.x * 100}%`,
          top: `${point.y * 100}%`,
          transform: `translate(-50%, -60%) rotate(${angle.toFixed(1)}deg)`,
        }}
      />
    </div>
  );
}