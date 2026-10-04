import React, { useMemo, useRef } from 'react';
import { Image } from '@/components/ui/image';
import { useSize } from '@/hooks/use-size';
import { LUCKY_OLYMPUS_SCREEN } from './luckyOlympusAssets';
import { BACK_BOX, REEL_BOX, SCREEN_HEIGHT, SCREEN_WIDTH, SPIN_BOX, boxStyle } from './lucky/luckyLayout';
import useLuckyGame from './lucky/useLuckyGame';
import LuckyReels from './lucky/LuckyReels';
import '@/styles/lucky.css';

/** Lucky Olympus: oyun ekranı görseli, görseldeki SPIN düğmesi ve canlı makaralar. */
export default function LuckyOlympusGame({ onBack }) {
  const boxRef = useRef(null);
  const size = useSize(boxRef);
  const game = useLuckyGame();

  // Görselin tamamı görünür kalır; canlı katmanlar görselin oranına oturur.
  const frame = useMemo(() => {
    const width = size?.width || 0;
    const height = size?.height || 0;
    if (!width || !height) return null;
    const scale = Math.min(width / SCREEN_WIDTH, height / SCREEN_HEIGHT);
    const w = SCREEN_WIDTH * scale;
    const h = SCREEN_HEIGHT * scale;
    return { width: w, height: h, left: (width - w) / 2, top: (height - h) / 2 };
  }, [size]);

  return (
    <div ref={boxRef} className="relative h-full w-full overflow-hidden bg-slot">
      {frame && (
        <div className="absolute" style={{ left: frame.left, top: frame.top, width: frame.width, height: frame.height }}>
          <Image
            src={LUCKY_OLYMPUS_SCREEN}
            alt="Lucky Olympus"
            fittingType="fill"
            quality={92}
            className="absolute inset-0 h-full w-full"
          />

          {/* Makara alanı: görseldeki ızgaranın tam üzerinde durur. */}
          <div className="absolute" style={boxStyle(REEL_BOX)}>
            <LuckyReels
              grid={game.grid}
              multiValues={game.multiValues}
              spinning={game.spinning}
              spinId={game.spinId}
            />
          </div>

          {/* Görseldeki profil simgesi: oyun merkezine dönüş alanı. */}
          <button
            type="button"
            onClick={onBack}
            aria-label="Oyun merkezine dön"
            className="absolute rounded-full"
            style={boxStyle(BACK_BOX)}
          />

          {/* Görseldeki SPIN düğmesi. */}
          <button
            type="button"
            onClick={game.runSpin}
            disabled={game.spinning || game.status !== 'ready'}
            aria-label="Döndür"
            className="absolute rounded-full"
            style={boxStyle(SPIN_BOX)}
          />
        </div>
      )}
    </div>
  );
}