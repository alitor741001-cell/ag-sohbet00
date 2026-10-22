import React from 'react';
import { Coins } from 'lucide-react';
import ReferenceChoiceButton from '@/components/games/controls/ReferenceChoiceButton';
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
          <ReferenceChoiceButton key={level} disabled={disabled} onClick={() => onStake(level)}>
            <Coins className="h-4 w-4" />{formatCoins(level)}
          </ReferenceChoiceButton>
        ))}
      </div>

      <ReferenceChoiceButton onClick={onFollow} aria-pressed={follow}>
        Önceki Seçimi Takip Et
      </ReferenceChoiceButton>
    </div>
  );
}