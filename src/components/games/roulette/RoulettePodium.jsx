import React from 'react';
import { Crown } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { formatCoins } from './rouletteConfig';

const MEDALS = ['rl-podium-gold', 'rl-podium-silver', 'rl-podium-bronze'];

function PodiumSlot({ winner, rank }) {
  const name = winner?.user_name || 'Kullanıcı';
  return (
    <div className={`rl-podium ${rank === 0 ? 'rl-podium-first' : ''}`}>
      <span className={`rl-podium-medal ${MEDALS[rank]}`}>
        {rank === 0 && <Crown aria-hidden="true" className="rl-podium-crown" />}
        <span className="rl-podium-avatar">
          {winner?.user_avatar ? (
            <Image src={winner.user_avatar} alt="" className="h-full w-full" fittingType="fill" quality={60} />
          ) : (
            <span className="rl-podium-initial">{name.trim().charAt(0).toUpperCase()}</span>
          )}
        </span>
        <span className="rl-podium-rank">{rank + 1}</span>
      </span>
      <span className="rl-podium-name" title={name}>{name}</span>
      <span className="rl-podium-amount">{formatCoins(winner?.payout)}</span>
    </div>
  );
}

/** Çarkın sağındaki sıralama rayı: en çok kazanan üç oyuncu alt alta durur. */
export default function RoulettePodium({ winners, ready }) {
  return (
    <div className="rl-podium-strip">
      <p className="rl-podium-title">SIRALAMA</p>
      {winners.length ? (
        <div className="rl-podium-row">
          {[0, 1, 2].filter((rank) => winners[rank]).map((rank) => (
            <PodiumSlot key={rank} rank={rank} winner={winners[rank]} />
          ))}
        </div>
      ) : (
        <p className="rl-podium-empty">
          {ready ? 'Henüz kazanan yok' : 'Yükleniyor...'}
        </p>
      )}
    </div>
  );
}