import React from 'react';
import { Image } from '@/components/ui/image';
import useSymbolTile from '@/lib/symbolTile';
import { FRUIT_ART_SIZE } from './fruitAssets';

/** Meyve görseli: karenin arkasındaki zemin kesilir, nesne şeffaf zeminde kalır. */
export default function FruitArt({ src, alt, className }) {
  const tile = useSymbolTile(src);
  return (
    <Image
      src={tile}
      alt={alt}
      className={className}
      fittingType="fit"
      blurPlaceholder={false}
      originWidth={FRUIT_ART_SIZE}
      originHeight={FRUIT_ART_SIZE}
      quality={88}
    />
  );
}