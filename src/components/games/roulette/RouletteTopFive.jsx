import React from 'react';
import { Image } from '@/components/ui/image';

const THRONES = ['gold', 'gold', 'blue', 'violet', 'green'];

/** TOP5: koyu panelde numaralı, tahtlı beş avatar çerçevesi. */
export default function RouletteTopFive({ winners }) {
  return (
    <div className="rl2-top5" aria-label="En çok kazanan 5 oyuncu">
      <span className="rl2-top5-label">TOP5</span>
      {THRONES.map((throne, rank) => {
        const winner = winners[rank];
        const name = winner?.user_name || '';
        return (
          <div key={rank} className={`rl2-seat rl2-seat-${throne}`}>
            <span className="rl2-seat-rank">{rank + 1}</span>
            <span className="rl2-seat-ring">
              {winner?.user_avatar ? (
                <Image src={winner.user_avatar} alt="" className="h-full w-full" fittingType="fill" quality={50} />
              ) : winner ? (
                <span className="rl2-seat-initial">{name.charAt(0).toUpperCase()}</span>
              ) : null}
            </span>
            <span className="rl2-seat-base">{winner ? `❤ ${name.slice(0, 5)}` : ''}</span>
          </div>
        );
      })}
    </div>
  );
}