import React from 'react';
import { Clapperboard, Coins, Crown, Star } from 'lucide-react';
import GameActionRow from '../controls/GameActionRow';
import GameStatCards from '../controls/GameStatCards';
import { LINES, formatCredits } from './sekerliConfig';

/**
 * Bilgi şeridi: coin bakiyem, toplam bahis, tur kazancı, toplam kazanç,
 * "15 çevirme hakkı" ve coin yükleme.
 */
export default function SekerliHud({ coins, bet, win, totalWon, busy, onCoins, onSession, sessionPrice, sessionSpins, sessionSize }) {
  const items = [
    { key: 'coins', label: 'COIN BAKİYEM', value: formatCredits(coins), icon: Star },
    { key: 'stake', label: 'TOPLAM BAHİS', value: formatCredits(bet * LINES), icon: Clapperboard },
    { key: 'win', label: 'KAZANÇ', value: formatCredits(win), icon: Crown, win: win > 0 },
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
        format={formatCredits}
      />
    </div>
  );
}