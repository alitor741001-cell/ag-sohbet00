import React from 'react';
import { Crown } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { formatCoins } from './zarConfig';

// Referans tasarımdaki TOP1-TOP4 şeridi: her sıranın kendi çerçeve rengi vardır.
const TONES = ['gold', 'silver', 'bronze', 'dark'];

/** En çok kazanan dört oyuncu: tur sonuçları geldikçe tazelenir. */
export default function ZarPodium({ winners, ready }) {
  return (
    <div className="zar-podium" aria-label="Turun en çok kazananları">
      {TONES.map((tone, rank) => {
        const winner = winners[rank];
        const name = winner?.user_name || '';
        return (
          <span key={tone} className={`zar-top zar-top-${tone}`}>
            <span className="zar-top-avatar">
              {rank === 0 && <Crown aria-hidden="true" className="zar-top-crown" />}
              {winner?.user_avatar ? (
                <Image src={winner.user_avatar} alt="" className="h-full w-full" fittingType="fill" quality={60} />
              ) : (
                <span className="zar-top-initial">{name ? name.trim().charAt(0).toUpperCase() : '·'}</span>
              )}
            </span>
            <span className="zar-top-rank">TOP{rank + 1}</span>
            <span className="zar-top-amount">{winner ? formatCoins(winner.payout) : ready ? '–' : '…'}</span>
          </span>
        );
      })}
    </div>
  );
}