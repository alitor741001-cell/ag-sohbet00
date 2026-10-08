import React from 'react';
import GameActionRow from '../controls/GameActionRow';
import { formatCoins } from './dedeConfig';

/** Bilgi şeridi: coin bakiyem, toplam bahis, tur kazancı, toplam kazanç ve eylem düğmeleri. */
export default function DedeHud({ coins, bet, lines, win, totalWon, busy, onCoins, onSession, sessionPrice, sessionSpins, sessionSize }) {
  const items = [
    { key: 'coins', label: 'COIN BAKİYEM', value: formatCoins(coins) },
    { key: 'stake', label: 'TOPLAM BAHİS', value: formatCoins(bet * lines) },
    { key: 'win', label: 'KAZANÇ', value: formatCoins(win), win: win > 0 },
    { key: 'total', label: 'TOPLAM', value: formatCoins(totalWon) },
  ];

  return (
    <div className="grid w-full max-w-[27rem] grid-cols-4 gap-1.5">
      {items.map((item) => (
        <div key={item.key} className={`dede-chip ${item.win ? 'dede-chip-win' : ''}`}>
          <span className="dede-chip-label">{item.label}</span>
          <span className="dede-chip-value">{item.value}</span>
        </div>
      ))}

      <GameActionRow
        coins={coins}
        sessionPrice={sessionPrice}
        sessionSpins={sessionSpins}
        sessionSize={sessionSize}
        busy={busy}
        onSession={onSession}
        onCoins={onCoins}
        format={formatCoins}
      />
    </div>
  );
}