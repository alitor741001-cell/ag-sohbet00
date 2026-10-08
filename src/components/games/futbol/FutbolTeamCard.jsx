import React from 'react';
import { Flame, User, Users } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { FUTBOL_CREST_SIZE } from './futbolAssets';
import { compactCoins } from './futbolConfig';

/** Takım kartı: arma, çarpan, popülerlik ve bahis rozetleri. */
export default function FutbolTeamCard({ team, stats, selected, hot, onSelect }) {
  const open = stats?.open !== false;
  const pot = stats?.pot ?? 0;
  const mine = stats?.mine ?? 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(team)}
      aria-pressed={selected}
      className={`fut-card fut-card-${team.size} ${selected ? 'fut-card-on' : ''} ${open ? '' : 'fut-card-lock'}`}
    >
      <span className="fut-card-top">
        <span className="fut-x">x{team.x}</span>
        {hot && pot > 0 && (
          <span className="fut-hot" title="Popülerlik">
            <span aria-hidden="true">⚽</span>
            <Flame className="h-3 w-3" />
          </span>
        )}
      </span>

      <span className="fut-crest-wrap">
        <Image
          src={team.crest}
          alt={team.name}
          className="fut-crest"
          fittingType="contain"
          originWidth={FUTBOL_CREST_SIZE}
          originHeight={FUTBOL_CREST_SIZE}
          quality={82}
        />
      </span>

      <span className="fut-card-name">{team.short}</span>

      <span className="fut-stats">
        {pot > 0 && (
          <span className="fut-pill fut-pill-all" title="Tüm kullanıcıların coin miktarı">
            <Users className="h-3 w-3" />
            {compactCoins(pot)}
          </span>
        )}
        {mine > 0 && (
          <span className="fut-pill fut-pill-mine" title="Seçimlerim">
            <User className="h-3 w-3" />
            {compactCoins(mine)}
          </span>
        )}
        {!open && <span className="fut-pill fut-pill-lock">KAPALI</span>}
      </span>
    </button>
  );
}