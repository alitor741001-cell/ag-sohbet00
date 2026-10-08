import React from 'react';
import FutbolTeamCard from './FutbolTeamCard';

/** Kart dizilimi: iki büyük kart, iki orta kart ve dört küçük kart. */
export default function FutbolTeamGrid({ teams, stats, selected, hot, onSelect }) {
  const rows = [
    teams.filter((team) => team.size === 'big'),
    teams.filter((team) => team.size === 'mid'),
    teams.filter((team) => team.size === 'small'),
  ];

  return (
    <div className="fut-grid">
      {rows.filter((row) => row.length > 0).map((row) => (
        <div key={row[0].size} className={`fut-row fut-row-${row.length}`}>
          {row.map((team) => (
            <FutbolTeamCard
              key={team.id}
              team={team}
              stats={stats[team.id]}
              selected={selected === team.id}
              hot={hot.has(team.id)}
              onSelect={onSelect}
            />
          ))}
        </div>
      ))}
    </div>
  );
}