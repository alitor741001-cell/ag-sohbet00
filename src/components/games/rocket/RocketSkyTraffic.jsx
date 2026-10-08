import React from 'react';
import { Image } from '@/components/ui/image';
import { ROCKET_JET } from '../rocketAssets';
import useCutoutImage from '@/lib/cutoutImage';

/**
 * Uzaktaki yolcu uçağı: gökyüzünde X ekseni boyunca soldan sağa geçer.
 * Yeri, burun açısı ve ölçeği birlikte X ilerlemesine bağlıdır — yaklaşırken
 * büyür, uzaklaşırken küçülür, ardında ince bir iz bırakır.
 */
export default function RocketSkyTraffic() {
  // Siyah zemini tarayıcıda gerçek zamanlı kesilmiş uçak görseli.
  const jetSrc = useCutoutImage(ROCKET_JET);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="rk-jet-lane rk-jet-cross">
        <span className="rk-jet-contrail" />
        {jetSrc && (
          <Image
            src={jetSrc}
            alt=""
            fittingType="fit"
            originWidth={1024}
            originHeight={1024}
            quality={80}
            className="rk-jet"
          />
        )}
      </span>
    </div>
  );
}