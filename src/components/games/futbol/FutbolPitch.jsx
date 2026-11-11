import React from 'react';
import FutbolTeamCard from './FutbolTeamCard';
import FutbolSelection from './FutbolSelection';
import FutbolNeedle from './FutbolNeedle';
import { TEAM_MAP, TEAMS, RING_SLOTS, RING_STYLES } from './futbolConfig';

/**
 * Saha: sekiz takım ortadaki çemberin üstünde dizilir, göbekte geri sayım durur.
 * Çekiliş ibresi göbeğin ortasından döner ve kazanan takımın hizasında durur.
 */
export default function FutbolPitch({
  teams,
  stats,
  chips,
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
  const winnerTeam = TEAM_MAP[revealed] || null;
  const winnerSlot = winnerId ? TEAMS.findIndex((team) => team.id === winnerId) : -1;

  return (
    <div className="fut-pitch">
      <div className="fut-ring">
        <span className="fut-track" aria-hidden="true" />

        {teams.map((team, index) => (
          <FutbolTeamCard
            key={team.id}
            team={team}
            stats={stats[team.id]}
            chips={chips?.[team.id] || []}
            selected={selected === team.id}
            landed={revealed === team.id}
            share={totalPot > 0 ? (stats[team.id]?.pot || 0) / totalPot : 0}
            onSelect={onSelect}
            style={RING_STYLES[index]}
          />
        ))}

        <FutbolNeedle
          angle={winnerSlot >= 0 ? RING_SLOTS[winnerSlot].angle : null}
          active={drawing}
          remaining={remaining}
          sound={sound}
          onLanded={onLanded}
        />

        <div className="fut-hub">
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
      </div>
    </div>
  );
}