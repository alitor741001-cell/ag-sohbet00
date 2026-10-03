import React from 'react';
import useSlotGame from './slot/useSlotGame';
import SlotDecor from './slot/SlotDecor';
import SlotHeader from './slot/SlotHeader';
import JackpotBar from './slot/JackpotBar';
import SlotGrid from './slot/SlotGrid';
import SlotStatsRow from './slot/SlotStatsRow';
import BetControls from './slot/BetControls';
import SlotActionBar from './slot/SlotActionBar';

export default function SlotGame() {
  const game = useSlotGame();

  return (
    <div className="relative min-h-0 flex-1 overflow-y-auto bg-slot">
      <SlotDecor />
      <div className="relative z-10 flex flex-col gap-3 px-3 pb-4 pt-3">
        <SlotHeader />

        {game.status === 'loading' ? (
          <p className="py-20 text-center text-xs font-bold text-slot-gold/70">Oyun yükleniyor...</p>
        ) : (
          <>
            <JackpotBar jackpots={game.jackpots} progress={game.progress} />
            <SlotGrid
              grid={game.displayGrid}
              rollingReels={game.rollingReels}
              tick={game.tick}
              winCells={game.winCells}
            />
            <SlotStatsRow lines={game.lines} totalBet={game.bet * game.lines} win={game.win} />
            <BetControls
              bet={game.bet}
              coins={game.coins}
              bonusReady={game.bonusReady}
              bonusAmount={game.bonusAmount}
              onBet={game.changeBet}
              onMax={game.maxBet}
              onBonus={game.claimBonus}
            />
            <SlotActionBar
              auto={game.auto}
              spinning={game.spinning}
              disabled={game.status !== 'ready'}
              onAuto={game.toggleAuto}
              onSpin={game.spin}
            />
          </>
        )}

        {game.message && <p className="text-center text-[11px] font-bold text-slot-gold">{game.message}</p>}
      </div>
    </div>
  );
}