import React, { useRef } from 'react';
import { useSize } from '@/hooks/use-size';
import { Image } from '@/components/ui/image';
import { ROCKET_SHIP } from '../rocketAssets';
import { flightAngle, flightPoint } from './rocketPath';

/**
 * Roketin kendisi: kavisli rota üzerinde yükselir, gövdesi uçuş yönüne döner,
 * motoru canlı bir alev püskürtür. Bahis aşamasında yerinde süzülür.
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
      {phase !== 'crashed' && (
        <div
          className="rk-ship-wrap absolute w-[19%] max-w-[6rem]"
          style={{
            left: `${point.x * 100}%`,
            top: `${point.y * 100}%`,
            transform: `translate(-50%, -50%) rotate(${angle.toFixed(2)}deg)`,
            transition: flying ? 'left 60ms linear, top 60ms linear, transform 60ms linear' : 'none',
          }}
        >
          <span aria-hidden="true" className={`rk-plume ${flying ? 'rk-plume-live' : ''}`} />
          <Image
            src={ROCKET_SHIP}
            alt="Uçan roket"
            fittingType="fit"
            className={`rk-ship relative block w-full ${flying ? '' : 'rk-idle'}`}
          />
        </div>
      )}
    </div>
  );
}