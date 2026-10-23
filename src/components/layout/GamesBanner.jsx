import { memo } from 'react';
import { useWhiteCutout } from '@/lib/whiteCutout';
import FixedBanner from '@/components/layout/FixedBanner';

const SHEET = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/c58ef9c52_IMG_0153.jpg';
const CROP = { x: 0, y: 0, w: 0.74, h: 0.54 };

/** Oyunlar başlığı: arka planı şeffaf, doğrudan ana temanın üstünde durur. */
function GamesBanner() {
  const src = useWhiteCutout(SHEET, CROP);
  return (
    <FixedBanner ratio="758 / 185" className="px-2 pt-2">
      {src && <img src={src} alt="Oyunlar" className="h-full w-full object-contain" />}
    </FixedBanner>
  );
}

export default memo(GamesBanner);