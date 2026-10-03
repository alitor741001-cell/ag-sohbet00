import React, { useState } from 'react';
import useSlotGame from './slot/useSlotGame';
import SlotDecor from './slot/SlotDecor';
import SlotBanner from './slot/SlotBanner';
import JackpotBar from './slot/JackpotBar';
import SlotReelFrame from './slot/SlotReelFrame';
import SlotGrid from './slot/SlotGrid';
import SlotStatsRow from './slot/SlotStatsRow';
import SlotBetDeck from './slot/SlotBetDeck';
import SlotActionDeck from './slot/SlotActionDeck';
import CoinSheet from './slot/CoinSheet';

export default function SlotGame({ onExit, onBack }) {
  const game = useSlotGame();
  const [coinOpen, setCoinOpen] = useState(false);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-slot">
      <SlotDecor />

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-2.5 pt-2.5">
        <SlotBanner onExit={onExit} onBack={onBack} />

        {game.status === 'loading' ? (
          <p className="py-20 text-center text-xs font-bold text-slot-gold/70">Oyun yükleniyor...</p>
        ) : (
          <>
            <JackpotBar jackpots={game.jackpots} progress={game.progress} />

            <div className="mt-2.5">
              <SlotReelFrame>
                <SlotGrid
                  grid={game.displayGrid}
                  rollingReels={game.rollingReels}
                  tick={game.tick}
                  winCells={game.winCells}
                />
              </SlotReelFrame>
            </div>

            <div className="mt-2.5">
              <SlotStatsRow lines={game.lines} totalBet={game.bet * game.lines} win={game.win} />
            </div>
          </>
        )}
      </div>

      <div className="relative z-10 shrink-0 border-t border-slot-gold/30 bg-slot-surface/95 px-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <SlotBetDeck
          bet={game.bet}
          auto={game.auto}
          spinning={game.spinning}
          onBet={game.changeBet}
          onAuto={game.toggleAuto}
        />
        <SlotActionDeck
          coins={game.coins}
          spinning={game.spinning}
          disabled={game.status !== 'ready'}
          onCoin={() => setCoinOpen(true)}
          onMax={game.maxBet}
          onSpin={game.spin}
        />
        {game.message && !coinOpen && (
          <p className="mt-1 text-center text-[11px] font-bold text-slot-gold">{game.message}</p>
        )}
      </div>

      <CoinSheet
        open={coinOpen}
        onClose={() => setCoinOpen(false)}
        coins={game.coins}
        bonusReady={game.bonusReady}
        bonusAmount={game.bonusAmount}
        message={game.message}
        onClaim={game.claimBonus}
      />
    </div>
  );
}