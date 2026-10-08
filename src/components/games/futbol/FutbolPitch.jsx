import React, { useRef } from 'react';
import FutbolTeamCard from './FutbolTeamCard';
import FutbolSelection from './FutbolSelection';
import FutbolSquare from './FutbolSquare';
import { PITCH_ROWS, TEAM_MAP } from './futbolConfig';

/**
 * Saha: kale ortada, takım kartları onun çevresinde kemer biçiminde dizilir.
 * Ortadaki kupa yoktur; onun yerine çekiliş karesi kartların üstünde döner.
 */
export default function FutbolPitch({
  teams,
  stats,
  hot,
  totalPot,
  selected,
  onSelect,
  winnerId,
  revealed,
  mineOnWinner,
  count,
  drawing,
  clock,
  ratio,
  hasPicks,
  onClear,
  remaining,
  sound,
  onLanded,
}) {
  const pitchRef = useRef(null);
  const winnerTeam = TEAM_MAP[revealed] || null;

  return (
    <div className="fut-pitch" ref={pitchRef}>
      {PITCH_ROWS.map((row) => (
        <div key={row} className={`fut-row fut-row-${row}`}>
          {teams.filter((team) => team.row === row).map((team) => (
            <FutbolTeamCard
              key={team.id}
              team={team}
              stats={stats[team.id]}
              selected={selected === team.id}
              landed={revealed === team.id}
              share={totalPot > 0 ? (stats[team.id]?.pot || 0) / totalPot : 0}
              onSelect={onSelect}
            />
          ))}
        </div>
      ))}

      <div className="fut-band">
        <span className="fut-net" aria-hidden="true" />
        <FutbolSelection
          status={drawing ? 'drawing' : 'betting'}
          clock={clock}
          ratio={ratio}
          hasPicks={hasPicks}
          onClear={onClear}
        />
        <span className={`fut-chip ${winnerTeam ? 'fut-chip-win' : ''}`}>
          {winnerTeam
            ? `${winnerTeam.short} x${winnerTeam.x}${mineOnWinner > 0 ? ' · KAZANDIN!' : ''}`
            : `${count} SEÇİM`}
        </span>
      </div>

      <FutbolSquare
        containerRef={pitchRef}
        winner={winnerId}
        active={drawing}
        remaining={remaining}
        sound={sound}
        onLanded={onLanded}
      />
    </div>
  );
}