import React, { useRef } from 'react';
import { useSize } from '@/hooks/use-size';
import { Image } from '@/components/ui/image';
import { ROCKET_DESIGN, ROCKET_DESIGN_H, ROCKET_DESIGN_W } from '../rocketAssets';

/**
 * Oyun ekranının zemini: gönderilen tasarım görseli birebir gösterilir.
 * Görsel, tasarım pikselleriyle (828x1485) kurulan bir katmana oranı koruyarak
 * sığdırılır; canlı katman aynı koordinatlarda üstüne biner.
 */
export default function RocketScreen({ children }) {
  const ref = useRef(null);
  const size = useSize(ref);
  const width = size?.width || 0;
  const height = size?.height || 0;
  const scale = width && height ? Math.min(width / ROCKET_DESIGN_W, height / ROCKET_DESIGN_H) : 0;

  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden bg-[#05060f]">
      {scale > 0 && (
        <div
          className="absolute"
          style={{
            left: (width - ROCKET_DESIGN_W * scale) / 2,
            top: (height - ROCKET_DESIGN_H * scale) / 2,
            width: ROCKET_DESIGN_W,
            height: ROCKET_DESIGN_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <Image
            src={ROCKET_DESIGN}
            alt=""
            fittingType="fill"
            quality={92}
            className="absolute inset-0 h-full w-full"
          />
          {children}
        </div>
      )}
    </div>
  );
}