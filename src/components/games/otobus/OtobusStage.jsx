import React from 'react';
import useCutoutImage from '@/lib/cutoutImage';
import { formatMult } from '../rocket/rocketConfig';
import { OTOBUS_BUS } from './otobusAssets';
import { cruisePercent, rideProgress } from './otobusConfig';
import OtobusPlayers from './OtobusPlayers';
import OtobusHistorySide from './OtobusHistorySide';

function stateLabel(phase, countdown) {
  if (phase === 'betting') return countdown === null ? 'BAHİS AÇIK' : `BAHİS · ${countdown} SN`;
  if (phase === 'running') return 'YOLDA';
  if (phase === 'crashed') return 'ÇAKILDI';
  return 'YÜKLENİYOR';
}

/** Oyun sahnesi: asfalt yol, gökyüzü, dönen tekerlekli otobüs, çarpan ve oyuncu sayısı. */
export default function OtobusStage({ game }) {
  const phase = game.phase;
  const crashed = phase === 'crashed';
  const mult = crashed ? game.round?.crash_at || 1 : phase === 'running' ? game.displayMult : 1;
  const progress = phase === 'running' || crashed ? rideProgress(mult) : 0;
  const bus = useCutoutImage(OTOBUS_BUS);

  return (
    <div className={`ob-stage ${crashed ? 'ob-stage-crash' : ''}`}>
      <div className="ob-sky" />

      <span aria-hidden="true" className="ob-road" style={{ '--ob-heat': progress }} />

      <div
        className="ob-buswrap"
        style={{ '--ob-heat': progress, '--ob-cruise': `${cruisePercent(progress)}%` }}
      >
        <span aria-hidden="true" className="ob-flame" />
        {bus && <img src={bus} alt="" className="ob-bus" />}
      </div>

      <div className="ob-mult">
        <p className="ob-mult-value">{formatMult(mult)}</p>
        <p className="ob-mult-state">{stateLabel(phase, game.countdown)}</p>
      </div>

      <OtobusPlayers bets={game.bets} />
      <OtobusHistorySide history={game.history} onOpen={game.onOpenBoard} />

      {crashed && <span key={game.round?.round_no} aria-hidden="true" className="ob-burst" />}
    </div>
  );
}