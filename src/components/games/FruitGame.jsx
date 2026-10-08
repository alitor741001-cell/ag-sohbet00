import React, { useEffect, useState } from 'react';
import { ChevronLeft, Gift, X } from 'lucide-react';
import '@/styles/fruit.css';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import useFruitGame from './fruit/useFruitGame';
import FruitReels from './fruit/FruitReels';
import FruitHud from './fruit/FruitHud';
import FruitBetBar from './fruit/FruitBetBar';
import FruitSpinButton from './fruit/FruitSpinButton';
import FruitWinOverlay from './fruit/FruitWinOverlay';
import { FRUIT_LINES, formatCoins } from './fruit/fruitConfig';

const WIN_FLASH_MS = 2400;

/** MEYVE: altın çerçeveli premium meyve oyunu. Semboller ekranın her yerinde öder. */
export default function FruitGame({ onExit, onBack }) {
  const game = useFruitGame();
  const [coinOpen, setCoinOpen] = useState(false);
  const [flash, setFlash] = useState(0);
  const [prize, setPrize] = useState(null);
  const ready = game.status === 'ready';

  // Tur sonucu: büyük kazançta kutlama ekranı, küçük kazançta kısa parıltı.
  useEffect(() => {
    if (!game.spins) return undefined;
    if (game.bigWin > 0) {
      setPrize({ amount: game.bigWin });
      return undefined;
    }
    if (game.win > 0) {
      setFlash(game.win);
      const timer = window.setTimeout(() => setFlash(0), WIN_FLASH_MS);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [game.spins]);

  return (
    <div className="fruit-sky relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <span aria-hidden="true" className="fruit-rays" />

      <header className="relative z-10 flex shrink-0 items-center gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="fruit-icon-btn">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="fruit-bubble-text text-lg">MEYVE</p>
          <p className="text-[9px] font-black tracking-[0.14em] text-[#ffe0a8]/75">
            SEMBOLLER EKRANIN HER YERİNDE ÖDER
          </p>
        </div>
        <button
          type="button"
          onClick={onExit}
          aria-label="Oyunu kapat"
          className="fruit-icon-btn ring-1 ring-[#f0c46a]/50"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center gap-2 px-2 py-2">
        {/* Izgara ekranın kalan tüm alanını kaplar: kartlar olabildiğince büyük durur. */}
        <div className="flex min-h-0 w-full flex-1 items-center justify-center">
          <div className="fruit-frame flex aspect-[6/5] max-h-full w-full max-w-[34rem] p-2 sm:p-3">
            <FruitReels spinning={game.spinning} stopping={game.stopping} grid={game.grid} wins={game.wins} />
          </div>
        </div>

        {game.freeSpins > 0 && (
          <p className="flex items-center gap-1.5 rounded-full border border-[#f0c46a]/80 bg-black/45 px-3 py-1 text-[10px] font-black tracking-[0.12em] text-[#ffe9b8]">
            <Gift className="h-3.5 w-3.5" /> SERBEST TUR: {game.freeSpins}
          </p>
        )}

        <FruitHud
          coins={game.coins}
          bet={game.bet}
          lines={FRUIT_LINES}
          win={game.win}
          totalWon={game.totalWon}
          onCoins={() => setCoinOpen(true)}
          onSession={game.buySession}
          sessionPrice={game.sessionPrice}
          sessionSpins={game.sessionSpins}
          freeSpins={game.freeSpins}
        />

        {game.status === 'loading' && <p className="text-[11px] font-bold text-[#ffe9b8]">Oyun yükleniyor...</p>}
      </main>

      <footer className="relative z-10 flex shrink-0 flex-col items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
        <FruitBetBar
          bet={game.bet}
          lines={FRUIT_LINES}
          disabled={game.spinning}
          onStep={game.changeBet}
          onMax={game.maxBet}
        />
        <FruitSpinButton
          spinning={game.spinning}
          disabled={!ready}
          auto={game.auto}
          onSpin={game.spin}
          onStop={game.stop}
          onAuto={game.toggleAuto}
        />
      </footer>

      {flash > 0 && !prize && (
        <p
          key={flash}
          className="fruit-float-win pointer-events-none absolute left-1/2 top-[46%] z-20 rounded-full border border-[#ffe9b8]/80 bg-black/75 px-4 py-1.5 font-mono text-base font-black text-[#ffd35c]"
        >
          KAZANÇ {formatCoins(flash)}
        </p>
      )}

      {game.message && !coinOpen && !prize && (
        <p className="absolute left-1/2 top-[62%] z-20 w-max max-w-[90%] -translate-x-1/2 rounded-full bg-black/75 px-3 py-1.5 text-center text-[11px] font-bold text-[#ffd35c]">
          {game.message}
        </p>
      )}

      {/* Coin bakiyesine dokununca uygulamanın coin mağazası açılır. */}
      <CoinPurchasePanel open={coinOpen} coins={game.coins} onBack={() => setCoinOpen(false)} />

      <FruitWinOverlay open={!!prize} amount={prize?.amount || 0} onAccept={() => setPrize(null)} />
    </div>
  );
}