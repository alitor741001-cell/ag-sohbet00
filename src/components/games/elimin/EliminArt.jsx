import React from 'react';
import { Image } from '@/components/ui/image';
import useSymbolTile from '@/lib/symbolTile';
import { ELIMIN_ART_SIZE } from './eliminSymbolArt';

/** Sembol görseli: kare kart — zemini tek renk, kenarları temizlenmiş. */
export default function EliminArt({ src, alt, className }) {
  const tile = useSymbolTile(src);
  return (
    <Image
      src={tile}
      alt={alt}
      className={className}
      fittingType="fill"
      blurPlaceholder={false}
      originWidth={ELIMIN_ART_SIZE}
      originHeight={ELIMIN_ART_SIZE}
    />
  );
}