import React from 'react';
import { ChevronsRight, Coins, Trophy } from 'lucide-react';
import { formatCoins } from './futbolConfig';

/** Alt bilgi şeridi: bakiyem, geçiş oku ve bugünün ödülleri. */
export default function FutbolBalanceBar({ coins, today, onCoins }) {
  return (
    <div className="fut-balance">
      <button type="button" onClick={onCoins} className="fut-balance-cell">
        <span className="fut-balance-label">BAKİYEM</span>
        <span className="fut-balance-value">
          <Coins className="h-3.5 w-3.5" />
          {formatCoins(coins)}
        </span>
      </button>

      <span className="fut-balance-arrow" aria-hidden="true">
        <ChevronsRight className="h-4 w-4" />
      </span>

      <div className="fut-balance-cell fut-balance-cell-end">
        <span className="fut-balance-label">BUGÜNÜN ÖDÜLLERİ</span>
        <span className="fut-balance-value fut-balance-gold">
          <Trophy className="h-3.5 w-3.5" />
          {formatCoins(today)}
        </span>
      </div>
    </div>
  );
}