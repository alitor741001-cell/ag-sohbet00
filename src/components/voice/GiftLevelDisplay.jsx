import { Coins, Crown } from 'lucide-react';
import { formatCoins } from '@/lib/giftTone';

export default function GiftLevelDisplay({ level, percent, sending, next, remainingCoins }) {
  return (
    <div className="gift-palace-level">
      <span className="gift-palace-level-emblem">
        <Crown aria-hidden="true" />
        <span className="gift-palace-badge"><small>LVL</small><strong>{level}</strong></span>
      </span>
      <div className="gift-palace-level-track" role="progressbar" aria-label={`${sending ? 'Atış' : 'Alış'} seviyesi ilerlemesi`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="gift-palace-level-fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="gift-palace-level-title">{sending ? 'Atış' : 'Alış'} LVL <strong>{level}</strong></span>
      <span className="gift-palace-level-remaining">
        <Coins aria-hidden="true" />
        <span>{next === null ? 'En üst seviye' : `Kalan ${formatCoins(remainingCoins)} coin`}</span>
      </span>
    </div>
  );
}