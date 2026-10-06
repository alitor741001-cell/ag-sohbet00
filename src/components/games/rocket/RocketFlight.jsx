import React from 'react';
import { Image } from '@/components/ui/image';
import { ROCKET_SHIP } from '../rocketAssets';
import { FLIGHT_CURVE } from './rocketPath';

/**
 * Uçuş katmanı: mekiğin yeri, dönüşü, motor alevi ve hız izi her karede
 * doğrudan DOM transformu ile güncellenir (bkz. useRocketFlight).
 */
export default function RocketFlight({ shipRef, flameRef, trailRef }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      {/* Kalkış rampası: roket geri sayım ve hazırlık boyunca burada bekler. */}
      <div
        className="rk-pad absolute"
        style={{ left: `${FLIGHT_CURVE.start.x * 100}%`, top: `${FLIGHT_CURVE.start.y * 100}%` }}
        aria-hidden="true"
      />
      <div ref={shipRef} className="rk-ship-wrap absolute left-0 top-0 w-[22%] max-w-[6.5rem]">
        <div ref={trailRef} className="rk-trail" aria-hidden="true" />
        <div ref={flameRef} className="rk-flame" aria-hidden="true" />
        <Image
          src={ROCKET_SHIP}
          alt="Uçan roket"
          fittingType="fit"
          className="relative z-10 block aspect-square w-full"
        />
      </div>
    </div>
  );
}