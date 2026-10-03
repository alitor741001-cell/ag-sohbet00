import React from 'react';
import { Crown } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { ROCKET_BG } from '../rocketAssets';
import { formatMult } from './rocketConfig';
import { flightPoint } from './rocketPath';
import RocketPlayers from './RocketPlayers';
import RocketTrail from './RocketTrail';

const PHASE_TEXT = { betting: 'Bahisler açık', running: 'Yükseliyor', crashed: 'Çakıldı' };
const PHASE_CLASS = { betting: 'text-[#7fe4ff]', running: 'text-[#7fe4ff]', crashed: 'text-red-400' };

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

      <div className="pointer-events-none absolute inset-y-0 left-[36%] right-0 flex flex-col items-center justify-center gap-1">
        <Crown className="h-4 w-4 text-[#ffb800]" />
        <p className="rocket-script text-[16px] leading-none text-white/85">Hayal Et · İzle · Keyfini Çıkar</p>
        <p
          key={`${roundNo}-${phase}`}
          className={`rk-mult text-[52px] leading-none ${crashed ? 'rk-mult-crash' : ''}`}
        >
          {formatMult(mult)}
        </p>
        <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${PHASE_CLASS[phase] || 'text-white/60'}`}>
          {PHASE_TEXT[phase] || ''}
        </p>
      </div>

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