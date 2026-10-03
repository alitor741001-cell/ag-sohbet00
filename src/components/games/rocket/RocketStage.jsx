import React from 'react';
import { Image } from '@/components/ui/image';
import { ROCKET_BG } from '../rocketAssets';
import { flightPoint } from './rocketPath';
import RocketPlayers from './RocketPlayers';
import RocketTrail from './RocketTrail';
import RocketReadout from './RocketReadout';

// Çarpan her ikiye katlandığında mekik yolda belirgin şekilde ilerler.
const travel = (mult) => 1 - 1 / (1 + Math.log(Math.max(1, mult)) / 1.5);

/** Oyun sahnesi: uzay arka planı, canlı roket uçuşu, oyuncular ve çarpan göstergesi. */
export default function RocketStage({ game }) {
  const phase = game.round?.status;
  const roundNo = game.round?.round_no || 0;
  const crashed = phase === 'crashed';
  const mult = crashed ? game.round?.crash_at || 1 : phase === 'running' ? game.liveMult : 1;
  const point = flightPoint(travel(mult));

  return (
    <div className={`relative min-h-0 flex-1 overflow-hidden ${crashed ? 'rk-shake' : ''}`}>
      <Image src={ROCKET_BG} alt="" className="absolute inset-0 h-full w-full" fittingType="fill" quality={88} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1d]/80 via-[#0a0f1d]/20 to-[#0a0f1d]/85" />

      <RocketTrail progress={travel(mult)} phase={phase} />
      <RocketPlayers bets={game.bets} me={game.me} />

      <RocketReadout phase={phase} mult={mult} countdown={game.countdown} roundNo={roundNo} />

      {crashed && (
        <div
          key={roundNo}
          className="rk-burst pointer-events-none absolute h-40 w-40 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
        />
      )}
    </div>
  );
}