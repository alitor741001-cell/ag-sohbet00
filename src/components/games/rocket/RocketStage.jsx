import React from 'react';
import { VolumeX } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { ROCKET_BG } from '../rocketAssets';
import { flightPoint } from './rocketPath';
import RocketPlayers from './RocketPlayers';
import RocketTrail from './RocketTrail';
import RocketHud from './RocketHud';
import RocketEdgeTicks from './RocketEdgeTicks';

// Çarpan her ikiye katlandığında mekik yolda belirgin şekilde ilerler.
const travel = (mult) => 1 - 1 / (1 + Math.log(Math.max(1, mult)) / 1.5);

/**
 * Oyun sahnesi: uzay zemini, üstte tur numarası, solda oyuncu listesi,
 * sağda dairesel çarpan göstergesi ve uçan mekik.
 */
export default function RocketStage({ game }) {
  const phase = game.phase;
  const roundNo = game.round?.round_no || 0;
  const crashed = phase === 'crashed';
  const mult = crashed ? game.round?.crash_at || 1 : phase === 'running' ? game.displayMult : 1;
  const progress = travel(mult);
  const point = flightPoint(progress);

  return (
    <div className={`relative flex min-h-0 flex-1 flex-col overflow-hidden ${crashed ? 'rk-shake' : ''}`}>
      <Image src={ROCKET_BG} alt="" className="absolute inset-0 h-full w-full" fittingType="fill" quality={88} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0b1e]/72 via-[#0a0b1e]/18 to-[#0a0b1e]/88" />

      <p className="relative z-10 shrink-0 pt-1 text-center text-[11px] font-black tracking-wide text-[#eaf2ff]">
        Turlar:<span className="text-[#5fc9ff]">{roundNo || 1}</span>
      </p>

      <div className="relative z-10 flex min-h-0 flex-1 items-stretch gap-1.5 p-1.5 pt-1">
        <RocketPlayers bets={game.bets} me={game.me} />

        <div className="relative flex min-w-0 flex-1 items-center justify-center">
          <RocketTrail progress={progress} phase={phase} />
          <span aria-hidden="true" className="rk-mini-btn absolute right-0.5 top-0.5">
            <VolumeX className="h-3.5 w-3.5" />
          </span>
          <RocketHud phase={phase} mult={mult} countdown={game.countdown} progress={progress} />
          {crashed && (
            <div
              key={roundNo}
              className="rk-burst pointer-events-none absolute h-40 w-40 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
            />
          )}
        </div>

        <RocketEdgeTicks />
      </div>
    </div>
  );
}