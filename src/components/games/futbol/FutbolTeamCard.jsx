import React from 'react';
import { User, Users } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { FUTBOL_CREST_SIZE } from './futbolAssets';
import { compactCoins } from './futbolConfig';

/** Takım kartı: arma, altta çarpan, mavi popülerlik barı ve kendi bahsim. */
function FutbolTeamCard({ team, stats, selected, landed, share, onSelect, style }) {
  const open = stats?.open !== false;
  const pot = stats?.pot ?? 0;
  const mine = stats?.mine ?? 0;
  const ratio = Math.max(0, Math.min(1, share || 0));
  const width = pot > 0 ? Math.max(ratio * 100, 8) : 0;

  return (
    <button
      type="button"
      data-team-card={team.id}
      onClick={() => onSelect(team)}
      aria-pressed={selected}
      style={style}
      className={`fut-card fut-card-${team.size} ${selected ? 'fut-card-on' : ''} ${landed ? 'fut-card-win' : ''} ${open ? '' : 'fut-card-lock'}`}
    >
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

      <span className="fut-card-foot">
        <span className="fut-card-name">{team.short}</span>
        <span className="fut-x">x{team.x}</span>
      </span>

      <span className="fut-bar" title={`Tüm kullanıcıların coin miktarı: ${compactCoins(pot)}`}>
        <span className="fut-bar-fill" style={{ width: `${width}%` }} />
        <span className="fut-bar-text">
          <Users className="h-3 w-3" />
          {compactCoins(pot)}
        </span>
      </span>

      {mine > 0 && (
        <span className="fut-pill fut-pill-mine">
          <User className="h-3 w-3" />
          {compactCoins(mine)}
        </span>
      )}
      {!open && <span className="fut-pill fut-pill-lock">KAPALI</span>}
    </button>
  );
}

// Çekiliş karesi akarken kartlar yeniden çizilmez.
export default React.memo(FutbolTeamCard);