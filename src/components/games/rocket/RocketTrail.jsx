import React, { useRef } from 'react';
import { useSize } from '@/hooks/use-size';
import { Image } from '@/components/ui/image';
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
      {flying && <div className="rk-streak absolute inset-0" />}
      {phase !== 'crashed' && (
        <div
          className="absolute w-[24%] max-w-[7rem]"
          style={{
            left: `${point.x * 100}%`,
            top: `${point.y * 100}%`,
            transform: `translate(-50%, -50%) rotate(${angle.toFixed(2)}deg)`,
            transition: flying ? 'left 60ms linear, top 60ms linear, transform 60ms linear' : 'none',
          }}
        >
          {flying && <div className="rk-engine-glow rk-engine pointer-events-none absolute left-1/2 top-[75%] h-full w-1/2 -translate-x-1/2" />}
          <Image
            src={ROCKET_SHIP}
            alt="Uçan roket"
            fittingType="fit"
            className={`rk-ship relative block aspect-square w-full ${phase === 'betting' ? 'rk-idle' : ''}`}
          />
        </div>
      )}
    </div>
  );
}