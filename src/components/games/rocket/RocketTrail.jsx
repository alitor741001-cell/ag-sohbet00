import React, { useRef } from 'react';
import { useSize } from '@/hooks/use-size';
import { Image } from '@/components/ui/image';
import { ROCKET_SHIP } from '../rocketAssets';
import useCutoutImage from '@/lib/cutoutImage';
import { flightAngle, flightPoint } from './rocketPath';

/**
 * Roketin kendisi: yeri ve burnunun açısı doğrudan X eksenindeki ilerlemeden gelir —
 * rota üzerinde soldan sağa süzülür, burnu gittiği yöne döner, hızlandıkça gövdesi
 * yalpalar, uzaklaştıkça biraz küçülür ve motoru canlı alev püskürtür.
 */
export default function RocketTrail({ progress, phase }) {
  const ref = useRef(null);
  // Siyah zemini tarayıcıda gerçek zamanlı kesilmiş roket görseli.
  const shipSrc = useCutoutImage(ROCKET_SHIP);
  const size = useSize(ref);
  const width = size?.width || 0;
  const height = size?.height || 0;

  const flying = phase === 'running';
  const point = flightPoint(progress);
  // X ve Y oranları sahne ölçüsüyle piksele çevrilir: konum ekran genişliğine göre ölçeklenir.
  const x = point.x * width;
  const y = point.y * height;
  const angle = width && height ? flightAngle(progress, width, height) : 0;
  // Ufuktaki perspektif: X ilerledikçe gövde bir miktar uzaklaşır.
  const scale = 1 - 0.16 * Math.min(1, Math.max(0, progress || 0));

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden">
      {phase !== 'crashed' && width > 0 && shipSrc && (
        <div
          className="rk-ship-wrap absolute left-0 top-0 w-[20%] max-w-[7rem]"
          style={{
            transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${angle.toFixed(2)}deg) scale(${scale.toFixed(3)})`,
            transition: flying ? 'transform 90ms linear' : 'transform 320ms ease-out',
          }}
        >
          <span aria-hidden="true" className={`rk-plume ${flying ? 'rk-plume-live' : ''}`} />
          <span aria-hidden="true" className={`rk-ship-bob ${flying ? 'rk-fly' : 'rk-idle'}`}>
            <Image
              src={shipSrc}
              alt="Uçan roket"
              fittingType="fit"
              originWidth={1024}
              originHeight={1024}
              className="rk-ship relative block w-full"
            />
          </span>
        </div>
      )}
    </div>
  );
}