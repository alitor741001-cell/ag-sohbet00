import React from 'react';
import { Image } from '@/components/ui/image';
import { ROCKET_SCREEN } from '../rocketAssets';

/**
 * Görseldeki roket ve çevresindeki uzay katmanı: uçuş boyunca sağ-yukarı süzülür,
 * kenarları yumuşak maskeyle alttaki sabit görsele karışır. Böylece mekik gerçekten
 * hareket ederken paneller ve butonlar yerinde kalır.
 */
export default function RocketSky({ progress }) {
  const dx = progress * 6;
  const dy = progress * -6;
  const rot = progress * 1.4;

  return (
    <div aria-hidden="true" className="rocket-sky pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          transform: `translate3d(${dx.toFixed(2)}%, ${dy.toFixed(2)}%, 0) rotate(${rot.toFixed(2)}deg)`,
          transition: 'transform 420ms linear',
        }}
      >
        <Image
          src={ROCKET_SCREEN}
          alt=""
          className="absolute inset-0 h-full w-full"
          fittingType="fill"
          quality={88}
        />
      </div>
    </div>
  );
}