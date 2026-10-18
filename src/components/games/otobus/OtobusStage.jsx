import React from 'react';
import { Users } from 'lucide-react';
import { Image } from '@/components/ui/image';
import useCutoutImage from '@/lib/cutoutImage';
import { formatMult } from '../rocket/rocketConfig';
import { OTOBUS_BUS, OTOBUS_SCENE } from './otobusAssets';
import { panPercent, rideProgress } from './otobusConfig';

function stateLabel(phase, countdown) {
  if (phase === 'betting') return countdown === null ? 'BAHİS AÇIK' : `BAHİS · ${countdown} SN`;
  if (phase === 'running') return 'YOLDA';
  if (phase === 'crashed') return 'ÇAKILDI';
  return 'YÜKLENİYOR';
}

/** Oyun sahnesi: savana panoraması, yolda giden otobüs, çarpan ve oyuncu sayısı. */
export default function OtobusStage({ game }) {
  const phase = game.phase;
  const crashed = phase === 'crashed';
  const mult = crashed ? game.round?.crash_at || 1 : phase === 'running' ? game.displayMult : 1;
  const progress = phase === 'running' || crashed ? rideProgress(mult) : 0;
  // Siyah zemini kesilen otobüs, savananın üstüne şeffaf oturur.
  const bus = useCutoutImage(OTOBUS_BUS);
  const players = new Set((game.bets || []).map((bet) => bet.user_id).filter(Boolean)).size;

  return (
    <div className={`ob-stage ${crashed ? 'ob-stage-crash' : ''}`}>
      <div className="ob-scene" style={{ '--ob-pan': `${panPercent(progress)}%` }}>
        <Image
          src={OTOBUS_SCENE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          fittingType="fill"
          quality={88}
        />
      </div>

      <span aria-hidden="true" className="ob-streaks" style={{ '--ob-heat': progress }} />

      <div className="ob-buswrap" style={{ '--ob-heat': progress }}>
        <span aria-hidden="true" className="ob-flame" />
        {bus && <img src={bus} alt="" className="ob-bus" />}
      </div>

      <div className="ob-mult">
        <p className="ob-mult-value">{formatMult(mult)}</p>
        <p className="ob-mult-state">{stateLabel(phase, game.countdown)}</p>
      </div>

      <span className="ob-players">
        <Users className="h-3.5 w-3.5" />
        {players}
      </span>

      {crashed && <span key={game.round?.round_no} aria-hidden="true" className="ob-burst" />}
    </div>
  );
}