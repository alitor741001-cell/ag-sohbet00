import React from 'react';
import { Image } from '@/components/ui/image';
import { FUTBOL_TROPHY, FUTBOL_CREST_SIZE } from './futbolAssets';
import { TEAM_MAP, compactCoins } from './futbolConfig';

/**
 * Saha ortası: kale filesi, altın kupa ve turun seçim sayısı.
 * Çekiliş anında kazanan takımın arması kupanın üstünde belirir.
 */
export default function FutbolTrophy({ count, winner, mine, drawing }) {
  const team = winner ? TEAM_MAP[winner] : null;

  return (
    <div className="fut-stage">
      <span className="fut-net" aria-hidden="true" />

      <div className="fut-stage-row">
        <div className="fut-count">
          <p className="fut-count-value">{compactCoins(count)}</p>
          <p className="fut-count-label">SEÇİM</p>
        </div>
        <div className="fut-trophy-wrap">
          <Image
            src={FUTBOL_TROPHY}
            alt="Altın kupa"
            className="fut-trophy"
            fittingType="fit"
            originWidth={FUTBOL_CREST_SIZE}
            originHeight={FUTBOL_CREST_SIZE}
            quality={88}
          />
        </div>
      </div>

      {team && !drawing && (
        <div key={winner} className={`fut-winner ${mine > 0 ? 'fut-winner-mine' : ''}`}>
          <Image
            src={team.crest}
            alt={team.name}
            className="fut-winner-crest"
            fittingType="contain"
            originWidth={FUTBOL_CREST_SIZE}
            originHeight={FUTBOL_CREST_SIZE}
            quality={82}
          />
          <span className="fut-winner-text">
            <p className="fut-winner-name">{team.name}</p>
            <p className="fut-winner-x">x{team.x}{mine > 0 ? ' · KAZANDIN!' : ''}</p>
          </span>
        </div>
      )}

      {drawing && <p className="fut-drawing">KAZANAN ÇEKİLİYOR...</p>}
    </div>
  );
}