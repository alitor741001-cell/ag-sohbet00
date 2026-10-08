import React from 'react';
import { Image } from '@/components/ui/image';
import { ROCKET_SPACE, ROCKET_PLANET } from '../rocketAssets';
import { flightPoint } from './rocketPath';
import RocketPlayers from './RocketPlayers';
import RocketTrail from './RocketTrail';
import RocketReadout from './RocketReadout';
import RocketFlightPath from './RocketFlightPath';
import RocketSkyTraffic from './RocketSkyTraffic';

// Çarpan her ikiye katlandığında roket yolda belirgin şekilde ilerler.
const travel = (mult) => 1 - 1 / (1 + Math.log(Math.max(1, mult)) / 1.5);

/** Oyun sahnesi: derin uzay, gezegen, kavisli uçuş yolu, gerçek roket ve HUD göstergesi. */
export default function RocketStage({ game }) {
  const phase = game.phase;
  const roundNo = game.round?.round_no || 0;
  const crashed = phase === 'crashed';
  const mult = crashed ? game.round?.crash_at || 1 : phase === 'running' ? game.displayMult : 1;
  const progress = travel(mult);
  const point = flightPoint(progress);

  return (
    <div className={`rk-stage relative min-h-0 flex-1 overflow-hidden ${crashed ? 'rk-shake' : ''}`}>
      <Image src={ROCKET_SPACE} alt="" className="rk-space absolute inset-0 h-full w-full" fittingType="fill" quality={85} />
      <span aria-hidden="true" className="rk-stars absolute inset-0" />
      <Image src={ROCKET_PLANET} alt="" className="rk-planet pointer-events-none absolute" fittingType="fill" quality={80} />
      <span aria-hidden="true" className="rk-vignette absolute inset-0" />
      <RocketSkyTraffic />

      {/* Uçuş rotası ve roketin kendisi. */}
      <RocketFlightPath progress={progress} />
      <RocketTrail progress={progress} phase={phase} />

      <RocketPlayers bets={game.bets} me={game.me} />
      <RocketReadout phase={phase} mult={mult} countdown={game.countdown} roundNo={roundNo} />

      {crashed && (
        <span
          key={roundNo}
          aria-hidden="true"
          className="rk-burst pointer-events-none absolute h-44 w-44"
          style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
        />
      )}
    </div>
  );
}