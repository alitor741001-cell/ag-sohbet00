import React from 'react';
import { Image } from '@/components/ui/image';
import { AVIATOR_PLANE } from '../rocketAssets';

/** Orijinal uçak görseli; siyah zemini "screen" karışımıyla görünmez olur. */
export default function AviatorPlane({ hue, className = '', style }) {
  return (
    <Image src={AVIATOR_PLANE} alt="Uçak" blurPlaceholder={false} fittingType="fit"
      className={`aspect-[3/2] mix-blend-screen ${className}`}
      style={{ ...style, filter: hue ? `hue-rotate(${hue}deg)` : 'none', transition: 'filter .4s' }} />
  );
}