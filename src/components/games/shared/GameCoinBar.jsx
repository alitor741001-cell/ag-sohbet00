import React from 'react';
import { Coins, Plus } from 'lucide-react';
import compactCoins from '@/lib/compactCoins';
import './gameCoinBar.css';

/** Sol üstte, NO:1 rozetinin yanında duran coin barı: dokununca coin mağazası açılır. */
export default function GameCoinBar({ coins, onClick, className = '' }) {
  return (
    <button type="button" onClick={onClick} aria-label="Coin bakiyesi, coin yükle" className={`gcb ${className}`}>
      <Coins className="gcb-coin" aria-hidden="true" />
      <span className="gcb-value tabular-nums">{coins === null || coins === undefined ? '—' : compactCoins(coins)}</span>
      <span className="gcb-plus" aria-hidden="true"><Plus strokeWidth={3.5} /></span>
    </button>
  );
}