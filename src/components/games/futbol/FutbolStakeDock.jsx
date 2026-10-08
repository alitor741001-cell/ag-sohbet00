import React from 'react';
import { Coins } from 'lucide-react';
import { STAKE_LEVELS, TEAM_MAP, formatCoins } from './futbolConfig';

/** Para butonları, "önceki seçimi takip et" ve seçili kart bilgisi. */
export default function FutbolStakeDock({ selected, disabled, follow, onStake, onFollow }) {
  const team = selected ? TEAM_MAP[selected] : null;

  return (
    <div className="fut-dock">
      <p className="fut-dock-hint">
        {team ? `${team.name} kartına bahis koy` : 'Bahis için önce bir takım kartı seç'}
      </p>

      <div className="fut-stakes">
        {STAKE_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            disabled={disabled}
            onClick={() => onStake(level)}
            className="fut-stake"
          >
            <Coins className="h-4 w-4" />
            {formatCoins(level)}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onFollow}
        aria-pressed={follow}
        className={`fut-follow ${follow ? 'fut-follow-on' : ''}`}
      >
        <span className="fut-radio" aria-hidden="true" />
        Önceki Seçimi Takip Et
      </button>
    </div>
  );
}