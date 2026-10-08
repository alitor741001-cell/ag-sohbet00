import React from 'react';
import { Image } from '@/components/ui/image';
import { FUTBOL_CREST_SIZE } from './futbolAssets';
import { TEAM_MAP, formatCoins } from './futbolConfig';

/** Tur kazancı kutlaması: kazanan takımın arması ve ödenen coin. */
export default function FutbolWinOverlay({ open, amount, winner, onAccept }) {
  if (!open) return null;
  const team = winner ? TEAM_MAP[winner] : null;

  return (
    <div className="fut-overlay">
      <div className="fut-overlay-card">
        <p className="fut-overlay-kicker">TUR KAZANCI</p>
        {team && (
          <Image
            src={team.crest}
            alt={team.name}
            className="fut-overlay-crest"
            fittingType="contain"
            originWidth={FUTBOL_CREST_SIZE}
            originHeight={FUTBOL_CREST_SIZE}
            quality={82}
          />
        )}
        <p className="fut-overlay-name">{team?.name || 'Kazanan takım'}</p>
        <p className="fut-overlay-amount">{formatCoins(amount)}</p>
        <p className="fut-overlay-label">COIN KAZANDIN</p>
        <button type="button" onClick={onAccept} className="fut-overlay-btn">KABUL ET</button>
      </div>
    </div>
  );
}