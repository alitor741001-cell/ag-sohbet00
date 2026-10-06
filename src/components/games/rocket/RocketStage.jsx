import React, { useRef } from 'react';
import { Image } from '@/components/ui/image';
import { useSize } from '@/hooks/use-size';
import { ROCKET_BG } from '../rocketAssets';
import { pointForMult } from './rocketPath';
import useRocketFlight from './useRocketFlight';
import RocketPlayers from './RocketPlayers';
import RocketFlight from './RocketFlight';
import CashOutMarkers from './CashOutMarkers';
import RocketReadout from './RocketReadout';

/** Oyun sahnesi: uzay zemini, 2D roket uçuşu, çekim profilleri ve çarpan. */
export default function RocketStage({ game }) {
  const stageRef = useRef(null);
  const size = useSize(stageRef);
  const { phase, round } = game;
  const crashed = phase === 'crashed';
  const crashMult = round?.crash_at || 1;
  const mult = crashed ? crashMult : phase === 'running' ? game.displayMult : 1;

  const flight = useRocketFlight({
    phase,
    startedAt: game.startedAt,
    crashMult,
    getNow: game.getNow,
    size,
    roundNo: round?.round_no,
  });

  // Patlama, roketin çakıldığı çarpanın uçuş alanındaki konumunda olur.
  const burst = pointForMult(crashMult);

  return (
    <div ref={stageRef} className={`relative min-h-0 flex-1 overflow-hidden ${crashed ? 'rk-shake' : ''}`}>
      <Image src={ROCKET_BG} alt="" className="absolute inset-0 h-full w-full" fittingType="fill" quality={88} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1d]/80 via-[#0a0f1d]/20 to-[#0a0f1d]/85" />

      <RocketPlayers bets={game.bets} me={game.me} />
      <CashOutMarkers bets={game.bets} />
      <RocketFlight shipRef={flight.shipRef} flameRef={flight.flameRef} trailRef={flight.trailRef} />

      <RocketReadout
        phase={phase}
        mult={mult}
        countdown={game.countdown}
        countdownMs={game.countdownMs}
        roundNo={round?.round_no}
      />

      {crashed && (
        <div
          key={round?.round_no}
          className="rk-burst pointer-events-none absolute z-40 h-40 w-40 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${burst.x * 100}%`, top: `${burst.y * 100}%` }}
        />
      )}
    </div>
  );
}