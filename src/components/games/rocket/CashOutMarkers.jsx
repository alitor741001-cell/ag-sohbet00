import React from 'react';
import { Image } from '@/components/ui/image';
import { pointForMult } from './rocketPath';
import { formatMult } from './rocketConfig';

// Uçuş alanını boğmamak için yalnızca son çekimler gösterilir.
const MAX_MARKERS = 24;

/**
 * Bahisten çekilen oyuncular: gerçek profil resmi ve çekildiği çarpan, o anki
 * roket konumunda belirir ve orada sabit kalır (roketle birlikte gitmez).
 */
export default function CashOutMarkers({ bets }) {
  const cashed = (bets || [])
    .filter((bet) => bet.status === 'cashed' && bet.cashout_at > 0)
    .sort((a, b) => b.cashout_at - a.cashout_at)
    .slice(0, MAX_MARKERS);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {cashed.map((bet) => {
        const point = pointForMult(bet.cashout_at);
        return (
          <div
            key={bet.id || `${bet.user_id}-${bet.slot}`}
            className="cashmark absolute"
            style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
          >
            <div className="cashmark-avatar">
              {bet.user_avatar ? (
                <Image src={bet.user_avatar} alt="" className="h-full w-full" fittingType="fill" quality={60} />
              ) : (
                <span>{(bet.user_name || '?').trim().charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="cashmark-mult">{formatMult(bet.cashout_at)}</span>
          </div>
        );
      })}
    </div>
  );
}