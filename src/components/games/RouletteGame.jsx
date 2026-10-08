import React, { useEffect, useState } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import '@/styles/roulette.css';
import '@/styles/gameControls.css';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import { Image } from '@/components/ui/image';
import useRouletteGame from './roulette/useRouletteGame';
import RouletteWheel from './roulette/RouletteWheel';
import RouletteTable from './roulette/RouletteTable';
import RouletteChipRow from './roulette/RouletteChipRow';
import RouletteStartButton from './roulette/RouletteStartButton';
import RouletteWinOverlay from './roulette/RouletteWinOverlay';
import { ROULETTE_LOGO } from './roulette/rouletteAssets';
import { formatCoins, pocketName, pocketTone } from './roulette/rouletteConfig';

/** ROULETTE: tek sıfırlı çark ve sekiz bloklu bahis masası. */
export default function RouletteGame({ onExit, onBack }) {
  const game = useRouletteGame();
  const [coinOpen, setCoinOpen] = useState(false);
  const [prize, setPrize] = useState(null);
  const ready = game.status === 'ready';

  // Tur sonucu: kazanç ödenmişse kutlama ekranı açılır.
  useEffect(() => {
    if (!game.result || !game.payout) return;
    setPrize({ amount: game.payout, number: game.result.number });
  }, [game.result, game.payout]);

  return (
    <div className="rl-sky relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <span aria-hidden="true" className="rl-rays" />

      <header className="relative z-10 flex shrink-0 items-center gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="gctl-pill gctl-icon">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <Image src={ROULETTE_LOGO} alt="" aria-hidden="true" className="rl-logo" fittingType="fill" quality={80} />
          <span className="min-w-0">
            <p className="rl-title">ROULETTE</p>
            <p className="rl-subtitle">TEK SIFIR · 0 x36 ÖDER</p>
          </span>
        </div>
        <button
          type="button"
          onClick={onExit}
          aria-label="Oyunu kapat"
          className="gctl-pill gctl-icon ring-1 ring-[#f0c96b]/50"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center gap-2 px-2 py-2">
        <div className="rl-wheel-wrap">
          <RouletteWheel index={game.result?.index ?? null} spinning={game.spinning} />
        </div>

        <div className="rl-result">
          {game.result ? (
            <>
              <span className={`rl-result-pocket rl-pocket-${pocketTone(game.result.number)}`}>{game.result.number}</span>
              <span className="rl-result-text">
                {pocketName(game.result.number)} · ÖDENEN {formatCoins(game.payout)}
              </span>
            </>
          ) : (
            <span className="rl-result-text">
              {game.spinning ? 'ÇARK DÖNÜYOR...' : `TOPLAM KAZANÇ ${formatCoins(game.totalWon)} · ${game.spins} TUR`}
            </span>
          )}
        </div>

        <RouletteTable bets={game.bets} disabled={game.spinning} onPlace={game.placeBet} />

        {game.status === 'loading' && <p className="rl-result-text">Oyun yükleniyor...</p>}
      </main>

      <footer className="relative z-10 flex shrink-0 justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
        <div className="gctl-deck">
          <RouletteChipRow
            coins={game.coins}
            chip={game.chip}
            stake={game.stake}
            canRepeat={!!game.lastBets}
            disabled={game.spinning}
            onChip={game.setChip}
            onRepeat={game.repeat}
            onClear={game.clearBets}
            onCoins={() => setCoinOpen(true)}
          />
          <RouletteStartButton
            spinning={game.spinning}
            ready={ready}
            countdown={game.countdown}
            canSpin={game.stake > 0}
            onStart={game.spin}
          />
        </div>
      </footer>

      {game.message && !coinOpen && !prize && (
        <p className="rl-message absolute left-1/2 top-[46%] z-20 w-max max-w-[90%] -translate-x-1/2 rounded-full px-3 py-1.5 text-center text-[11px] font-bold">
          {game.message}
        </p>
      )}

      {/* Coin bakiyesine dokununca uygulamanın coin mağazası açılır. */}
      <CoinPurchasePanel open={coinOpen} coins={game.coins} onBack={() => setCoinOpen(false)} />

      <RouletteWinOverlay
        open={!!prize}
        amount={prize?.amount || 0}
        number={prize?.number}
        onAccept={() => setPrize(null)}
      />
    </div>
  );
}