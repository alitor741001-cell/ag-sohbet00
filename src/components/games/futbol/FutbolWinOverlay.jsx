import React from 'react';
import { Image } from '@/components/ui/image';
import { FUTBOL_CREST_SIZE } from './futbolAssets';
import { TEAM_MAP, formatCoins } from './futbolConfig';

/** Tur kazancı: kazanan takımın arması, çarpanı ve hesaplanan ödeme. */
export default function FutbolWinOverlay({ open, amount, stake, winner, onAccept }) {
  if (!open) return null;
  const team = winner ? TEAM_MAP[winner] : null;
  const mult = team?.x || 0;
  const won = Math.max(0, Math.round(amount || 0));
  // Ödeme tam olarak "bahis x çarpan" olduğu için kazanan karta konan bahis buradan çıkar.
  const bet = mult > 0 ? Math.round(won / mult) : Math.max(0, Math.round(stake || 0));

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

        <span className="fut-overlay-mult">{mult}x</span>
        <p className="fut-overlay-calc">
          {formatCoins(bet)} × {mult} = <b>{formatCoins(won)}</b>
        </p>

        <p className="fut-overlay-amount">{formatCoins(won)}</p>
        <p className="fut-overlay-label">COIN KAZANDIN</p>
        <button type="button" onClick={onAccept} className="fut-overlay-btn">KABUL ET</button>
      </div>
    </div>
  );
}