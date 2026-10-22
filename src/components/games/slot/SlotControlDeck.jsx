import React from 'react';
import GameBetBar from '@/components/games/controls/GameBetBar';
import GameSpinButton from '@/components/games/controls/GameSpinButton';
import GameStatCards from '@/components/games/controls/GameStatCards';
import ReferenceCoinButton from '@/components/games/controls/ReferenceCoinButton';
import FreeSpinBadge from '@/components/games/slot/FreeSpinBadge';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

export default function SlotControlDeck({ coins, bet, lines, win, freeSpins, auto, spinning, ready, onStep, onMax, onAuto, onSpin, onStop, onCoins }) {
  const items = [
    { key: 'coins', label: 'COİN BAKİYESİ', value: format(coins) },
    { key: 'lines', label: 'HAT', value: format(lines) },
    { key: 'win', label: 'KAZANÇ', value: format(win) },
    { key: 'stake', label: 'TOPLAM BAHİS', value: format(bet * lines) },
  ];
  return (
    <div className="ref-slot-console">
      <GameStatCards items={items} />
      <ReferenceCoinButton coins={coins} onClick={onCoins} format={format} />
      <FreeSpinBadge count={freeSpins} />
      <div className="gctl-deck ref-deck">
        <GameBetBar bet={bet} disabled={spinning} maxDisabled={!ready} onStep={onStep} onMax={onMax} format={format} />
        <GameSpinButton spinning={spinning} disabled={!ready} spinDisabled={!ready} auto={auto} onAuto={onAuto} onSpin={onSpin} onStop={onStop} />
      </div>
    </div>
  );
}