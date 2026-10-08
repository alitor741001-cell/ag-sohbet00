import React from 'react';
import GameActionRow from '../controls/GameActionRow';
import { formatCoins } from './fruitConfig';

/** Bilgi şeridi: coin bakiyem, toplam bahis, tur kazancı, toplam kazanç ve eylem düğmeleri. */
export default function FruitHud({ coins, bet, lines, win, totalWon, busy, onCoins, onSession, sessionPrice, sessionSpins, freeSpins }) {
  const items = [
    { key: 'coins', label: 'COIN BAKİYEM', value: formatCoins(coins) },
    { key: 'stake', label: 'TOPLAM BAHİS', value: formatCoins(bet * lines) },
    { key: 'win', label: 'KAZANÇ', value: formatCoins(win), win: win > 0 },
    { key: 'total', label: 'TOPLAM', value: formatCoins(totalWon) },
  ];

  return (
    <div className="grid w-full max-w-[27rem] grid-cols-4 gap-1.5">
      {items.map((item) => (
        <div key={item.key} className={`fruit-chip ${item.win ? 'fruit-chip-win' : ''}`}>
          <span className="fruit-chip-label">{item.label}</span>
          <span className="fruit-chip-value">{item.value}</span>
        </div>
      ))}

      <GameActionRow
        coins={coins}
        sessionPrice={sessionPrice}
        sessionSpins={sessionSpins}
        freeSpins={freeSpins}
        busy={busy}
        onSession={onSession}
        onCoins={onCoins}
        format={formatCoins}
      />
    </div>
  );
}