import React from 'react';
import { Image } from '@/components/ui/image';
import { DEDE_ART_SIZE, DEDE_ORB_ART } from './dedeAssets';

/** Çarpan madalyonu: referans tasarımdaki kanatlı altın jeton, ortada değerin yazdığı küre. */
export default function DedeOrb({ value }) {
  const art = DEDE_ORB_ART[value];
  if (!art) return null;
  return (
    <Image
      src={art}
      alt={`${value}x çarpan`}
      className="dede-token"
      fittingType="fit"
      originWidth={DEDE_ART_SIZE}
      originHeight={DEDE_ART_SIZE}
      quality={88}
    />
  );
}