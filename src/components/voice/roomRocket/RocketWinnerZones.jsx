import React from 'react';
import { Coins } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { BASE_PRIZES, LEVEL_VIPS } from '@/components/voice/roomRocket/rocketArtwork';

/** Her sıranın ödül kutusu: üstte "ÖDÜL", coin ikonu ve tutar, altta "COINS"; 1. sırada ayrıca VIP. */
export default function RocketWinnerZones({ winners, level }) {
  const vip = LEVEL_VIPS[level - 1];
  return <>{BASE_PRIZES.map((base, index) => {
    const winner = winners.find(person => person.rank === index + 1);
    return <React.Fragment key={index}>
      {winner && (winner.avatar ? <Image src={winner.avatar} alt={winner.name} unoptimized loading="eager" fittingType="fill" className="room-rocket-winner-avatar" style={{ top: `${28.65 + index * 16.35}%` }} /> : <span className="room-rocket-winner-avatar flex items-center justify-center bg-slot-bg font-bold text-slot-gold" style={{ top: `${28.65 + index * 16.35}%` }} aria-label={winner?.name || 'Henüz kazanan yok'}>{winner.name?.trim()?.[0] || '?'}</span>)}
      {winner && <span className="room-rocket-winner-name" style={{ top: `${36.25 + index * 16.4}%` }} title={winner.name}>{winner.name}</span>}
      <span className="room-rocket-prize-label" style={{ top: `${27.05 + index * 16.4}%` }}>ÖDÜL</span>
      <output className="room-rocket-winner-prize" style={{ top: `${30.45 + index * 16.4}%` }} aria-label={`${index + 1}. kişi ödülü`}>
        <Coins className="room-rocket-prize-icon" aria-hidden="true" />
        {base * level}
      </output>
      <span className="room-rocket-prize-caption" style={{ top: `${35.35 + index * 16.4}%` }}>COINS</span>
      {index === 0 && <span className="room-rocket-prize-vip" style={{ top: `${38.2 + index * 16.4}%` }}>VIP {vip}</span>}
    </React.Fragment>;
  })}</>;
}