import React from 'react';
import { Image } from '@/components/ui/image';
import { BASE_PRIZES } from '@/components/voice/roomRocket/rocketArtwork';

/** Her sıranın kazanan görseli, adı ve coin ödülü. */
export default function RocketWinnerZones({ winners, level }) {
  return <>{BASE_PRIZES.map((base, index) => {
    const winner = winners.find(person => person.rank === index + 1);
    return <React.Fragment key={index}>
      {winner && (winner.avatar ? <Image src={winner.avatar} alt={winner.name} unoptimized loading="eager" fittingType="fill" className="room-rocket-winner-avatar" style={{ top: `${28.65 + index * 16.35}%` }} /> : <span className="room-rocket-winner-avatar flex items-center justify-center bg-slot-bg font-bold text-slot-gold" style={{ top: `${28.65 + index * 16.35}%` }} aria-label={winner?.name || 'Henüz kazanan yok'}>{winner.name?.trim()?.[0] || '?'}</span>)}
      {winner && <span className="room-rocket-winner-name" style={{ top: `${36.25 + index * 16.4}%` }} title={winner.name}>{winner.name}</span>}
      <output className="room-rocket-winner-prize" style={{ top: `${30.45 + index * 16.4}%` }} aria-label={`${index + 1}. kişi ödülü`}>{base * level}</output>
    </React.Fragment>;
  })}</>;
}