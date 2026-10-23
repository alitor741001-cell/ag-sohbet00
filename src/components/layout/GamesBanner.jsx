import { memo } from 'react';
import { useWhiteCutout } from '@/lib/whiteCutout';

const SHEET = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/c58ef9c52_IMG_0153.jpg';
const CROP = { x: 0, y: 0, w: 0.74, h: 0.54 };

/** Oyunlar başlığı: arka planı şeffaf, doğrudan ana temanın üstünde durur. */
function GamesBanner() {
  const src = useWhiteCutout(SHEET, CROP);
  return (
    <div className="sticky top-0 z-30 w-full px-2 pt-2">
      <div className="w-full" style={{ aspectRatio: '758 / 185' }}>
        {src && <img src={src} alt="Oyunlar" className="h-full w-full object-contain" />}
      </div>
    </div>
  );
}

export default memo(GamesBanner);