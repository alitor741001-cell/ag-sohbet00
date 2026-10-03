import React, { useState } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { SLOT_DECOR } from './slotAssets';
import useSlotGame from './slot/useSlotGame';
import SlotDecor from './slot/SlotDecor';
import SlotGrid from './slot/SlotGrid';
import SlotStatsRow from './slot/SlotStatsRow';
import SlotBetDeck from './slot/SlotBetDeck';
import SlotActionDeck from './slot/SlotActionDeck';
import CoinSheet from './slot/CoinSheet';

export default function SlotGame({ onExit, onBack }) {
  const game = useSlotGame();
  const [coinOpen, setCoinOpen] = useState(false);

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-slot">
      <div className="relative w-full shrink-0" style={{ aspectRatio: '1018 / 1545' }}>
        <Image
          src={SLOT_DECOR.shell}
          alt="filmkeyfi slot"
          className="absolute inset-0 h-full w-full"
          fittingType="fill"
        />

        <div className="slot-velvet absolute bottom-[42%] left-[10%] right-[10%] top-[36.5%] overflow-hidden rounded-lg">
          <SlotGrid
            grid={game.displayGrid}
            rollingReels={game.rollingReels}
            tick={game.tick}
            winCells={game.winCells}
          />
        </div>

        <button
          type="button"
          onClick={onBack}
          aria-label="Oyun listesine dön"
          className="slot-close absolute right-[13%] top-[1%] flex h-9 w-9 items-center justify-center rounded-full"
        >
          <ChevronLeft className="h-5 w-5 text-slot-gold" />
        </button>
        <button
          type="button"
          onClick={onExit}
          aria-label="Oyunu kapat"
          className="slot-close slot-close-x absolute right-[1.5%] top-[1%] flex h-9 w-9 items-center justify-center rounded-full"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        {game.status === 'loading' && (
          <p className="absolute inset-x-0 top-[46%] text-center text-xs font-bold text-slot-gold/80">
            Oyun yükleniyor...
          </p>
        )}

        <div className="absolute inset-x-0 bottom-0 top-[60%] overflow-hidden border-t-2 border-slot-gold/60 bg-slot-surface">
          <SlotDecor />
          <div className="relative flex h-full flex-col justify-center gap-1.5 px-2.5 py-2">
            <SlotStatsRow lines={game.lines} totalBet={game.bet * game.lines} win={game.win} />
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
              <p className="text-center text-[11px] font-bold text-slot-gold">{game.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 bg-slot-surface" />

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