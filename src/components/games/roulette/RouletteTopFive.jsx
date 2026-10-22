import React from 'react';
import { Crown } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { formatCoins } from './rouletteConfig';

/** TOP 5: en çok kazanan beş oyuncu üstte yatay sıra halinde durur. */
export default function RouletteTopFive({ winners, ready }) {
  const slots = [0, 1, 2, 3, 4];
  return (
    <div className="rl-topfive" aria-label="En çok kazanan 5 oyuncu">
      <span className="rl-topfive-label">TOP 5</span>
      <div className="rl-topfive-row">
        {slots.map((rank) => {
          const winner = winners[rank];
          const name = winner?.user_name || '';
          const firstName = name ? name.split(' ')[0] : '';
          return (
            <div key={rank} className={`rl-topfive-slot ${rank === 0 ? 'rl-topfive-first' : ''}`}>
              {rank === 0 && winner && <Crown aria-hidden="true" className="rl-topfive-crown" />}
              <span className="rl-topfive-avatar">
                {winner?.user_avatar ? (
                  <Image src={winner.user_avatar} alt="" className="h-full w-full" fittingType="fill" quality={50} />
                ) : winner ? (
                  <span className="rl-topfive-initial">{firstName.charAt(0).toUpperCase()}</span>
                ) : (
                  <span className="rl-topfive-initial" style={{ opacity: 0.3 }}>—</span>
                )}
              </span>
              <span className="rl-topfive-name">{winner ? firstName : 'Boş'}</span>
              <span className="rl-topfive-amount">{winner ? formatCoins(winner.payout) : '0'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}