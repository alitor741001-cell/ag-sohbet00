import React from 'react';
import { Image } from '@/components/ui/image';
import useSymbolTile from '@/lib/symbolTile';
import { SEKERLI_ART_SIZE } from './sekerliAssets';

/** Şeker görseli: karenin arkasındaki zemin kesilir, nesne şeffaf zeminde kalır. */
export default function SekerliArt({ src, alt, className }) {
  const tile = useSymbolTile(src);
  return (
    <Image
      src={tile}
      alt={alt}
      className={className}
      fittingType="fit"
      blurPlaceholder={false}
      originWidth={SEKERLI_ART_SIZE}
      originHeight={SEKERLI_ART_SIZE}
      quality={88}
    />
  );
}