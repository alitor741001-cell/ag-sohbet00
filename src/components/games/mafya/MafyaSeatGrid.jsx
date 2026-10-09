import React from 'react';
import { Crown, Skull } from 'lucide-react';
import { Image } from '@/components/ui/image';

/** Koltuklar: sağ olanlar parlak, ölenler soluk; oylama aşamasında oy verenler işaretlenir. */
export default function MafyaSeatGrid({ players, meId, hostId, showVotes }) {
  return (
    <div className="mf-seats">
      {players.map((player) => {
        const dead = player.alive === false;
        const initial = (player.name || 'O').slice(0, 1).toUpperCase();
        return (
          <div
            className={`mf-seat${player.user_id === meId ? ' mf-seat-self' : ''}${dead ? ' mf-seat-dead' : ''}`}
            key={player.user_id}
          >
            {showVotes && player.voted && !dead ? <span className="mf-seat-mark">✓</span> : null}
            <span className="mf-seat-avatar">
              {player.avatar ? (
                <Image src={player.avatar} alt="" className="h-full w-full" fittingType="fill" quality={70} />
              ) : (
                <span className="mf-seat-initial">{initial}</span>
              )}
            </span>
            <span className="mf-seat-name">{player.name}</span>
            {dead ? (
              <span className="mf-seat-tag mf-seat-tag-dead">
                <Skull className="h-2.5 w-2.5" /> ÖLDÜ
              </span>
            ) : player.user_id === hostId ? (
              <span className="mf-seat-tag">
                <Crown className="h-2.5 w-2.5" /> SAHİP
              </span>
            ) : player.ready ? (
              <span className="mf-seat-tag">HAZIR</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}