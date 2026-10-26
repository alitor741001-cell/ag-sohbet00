import React from 'react';
import { Image } from '@/components/ui/image';

export default function RocketWinnerProfiles({ data, level }) {
  const completed = data?.history?.find(round => round.level === level);
  const winners = completed?.winners || [];
  return <div className="room-rocket-profiles" aria-label={`LVL ${level} hediye sıralaması`}>
    {[1, 2, 3, 4].map((rank, index) => {
      const person = winners?.find(winner => winner.rank === rank);
      if (!person) return null;
      return <React.Fragment key={rank}>
        {person.avatar ? <Image src={person.avatar} alt={person.name || 'Üye'} fittingType="fill" className="room-rocket-profile-avatar" style={{ top: `${28.65 + index * 16.35}%` }} /> :
          <span className="room-rocket-profile-avatar flex items-center justify-center bg-slot-bg font-bold text-slot-gold" style={{ top: `${28.65 + index * 16.35}%` }} aria-label={person.name || 'Üye'}>{person.name?.trim()?.[0] || '?'}</span>}
        <span className="room-rocket-profile-name" style={{ top: `${37.1 + index * 16.15}%` }} title={person.name}>{person.name || 'Üye'}</span>
      </React.Fragment>;
    })}
  </div>;
}