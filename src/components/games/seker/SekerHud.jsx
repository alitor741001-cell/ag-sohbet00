import React from 'react';
import { Clapperboard, Coins, Crown, Star } from 'lucide-react';
import GameActionRow from '../controls/GameActionRow';
import GameStatCards from '../controls/GameStatCards';
import { formatCoins } from './sekerConfig';

/** Bilgi şeridi: coin bakiyem, toplam bahis, tur kazancı, toplam kazanç ve eylem düğmeleri. */
export default function SekerHud({ coins, bet, lines, win, totalWon, busy, onCoins, onSession, sessionPrice, sessionSpins, sessionSize }) {
  const items = [
    { key: 'coins', label: 'COIN BAKİYEM', value: formatCoins(coins), icon: Star },
    { key: 'stake', label: 'TOPLAM BAHİS', value: formatCoins(bet * lines), icon: Clapperboard },
    { key: 'win', label: 'KAZANÇ', value: formatCoins(win), icon: Crown, win: win > 0 },
  ];

  return (
    <div className="flex w-full max-w-[27rem] flex-col gap-1.5">
      <GameStatCards items={items} />

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