import React, { useRef } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useSize } from '@/hooks/use-size';
import { ROCKET_SCREEN } from './rocketAssets';
import { ART_WIDTH, ART_HEIGHT, ROCKET_LAYOUT } from './rocket/rocketLayout';
import useRocketGame from './rocket/useRocketGame';
import RocketReadout from './rocket/RocketReadout';
import RocketRecent from './rocket/RocketRecent';
import RocketPlayers from './rocket/RocketPlayers';
import RocketBetPanel from './rocket/RocketBetPanel';
import RocketRoundInfo from './rocket/RocketRoundInfo';

/** Crash Rocket: arka plan görseli birebir, canlı kontroller yerleri hizalı. */
export default function CrashRocketGame({ onExit, onBack }) {
  const game = useRocketGame();
  const frameRef = useRef(null);
  const size = useSize(frameRef);

  const cw = size?.width || 0;
  const ch = size?.height || 0;
  const scale = Math.min(cw / ART_WIDTH, ch / ART_HEIGHT) || 0;
  const imgW = ART_WIDTH * scale;
  const imgH = ART_HEIGHT * scale;
  const left = (cw - imgW) / 2;
  const top = (ch - imgH) / 2;

  return (
    <div ref={frameRef} className="relative h-full min-h-0 w-full overflow-hidden bg-slot">
      {imgW > 0 && (
        <div className="absolute" style={{ left, top, width: imgW, height: imgH }}>
          <Image
            src={ROCKET_SCREEN}
            alt="Crash Rocket oyun ekranı"
            className="absolute inset-0 h-full w-full"
            fittingType="fill"
            originWidth={ART_WIDTH}
            originHeight={ART_HEIGHT}
            quality={92}
          />

          <RocketReadout coins={game.coins} liveMult={game.liveMult} round={game.round} />
          <RocketRecent history={game.history} />
          <RocketPlayers bets={game.bets} me={game.me} />
          <RocketBetPanel game={game} />
          <RocketRoundInfo game={game} />
        </div>
      )}

      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-2 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Oyun listesine dön"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onExit}
          aria-label="Oyunu kapat"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {game.message && (
        <p className="absolute left-1/2 top-[14%] z-30 -translate-x-1/2 rounded-full bg-black/80 px-3 py-1.5 text-center text-[11px] font-bold text-amber-200">
          {game.message}
        </p>
      )}
    </div>
  );
}