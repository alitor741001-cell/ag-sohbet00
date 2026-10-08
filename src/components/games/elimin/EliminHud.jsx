import React from 'react';
import { Clapperboard, Coins, Crown, Star } from 'lucide-react';
import GameActionRow from '../controls/GameActionRow';
import GameStatCards from '../controls/GameStatCards';
import { LINES, formatCoins } from './eliminConfig';

/**
 * Bilgi şeridi (Şekerli Meyve'yle aynı): coin bakiyem, toplam bahis, tur kazancı,
 * toplam kazanç, "15 çevirme hakkı" ve coin yükleme.
 */
export default function EliminHud({ coins, bet, win, totalWon, busy, onCoins, onSession, sessionPrice, sessionSpins, sessionSize }) {
  const items = [
    { key: 'coins', label: 'COIN BAKİYEM', value: formatCoins(coins), icon: Star },
    { key: 'stake', label: 'TOPLAM BAHİS', value: formatCoins(bet * LINES), icon: Clapperboard },
    { key: 'win', label: 'KAZANÇ', value: formatCoins(win), icon: Crown, win: win > 0 },
    { key: 'total', label: 'TOPLAM KAZANÇ', value: formatCoins(totalWon), icon: Coins },
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