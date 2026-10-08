import React from 'react';
import { Image } from '@/components/ui/image';
import useCutoutImage from '@/lib/cutoutImage';
import { DEDE_ART_SIZE, DEDE_ORB_ART } from './dedeAssets';

/** Çarpan küresi: referans tasarımdaki kanatlı yeşil küre, ortasında değeri yazar. */
export default function DedeOrb({ value }) {
  const art = DEDE_ORB_ART[value];
  const cut = useCutoutImage(art || '');
  if (!art) return null;
  return (
    <span className="dede-orb">
      <Image
        src={cut || art}
        alt={`${value}x çarpan`}
        className="dede-token"
        fittingType="fit"
        originWidth={DEDE_ART_SIZE}
        originHeight={DEDE_ART_SIZE}
        quality={88}
      />
      <span className="dede-orb-value">{value}x</span>
    </span>
  );
}