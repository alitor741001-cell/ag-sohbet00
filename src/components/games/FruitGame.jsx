import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, HelpCircle, Play } from 'lucide-react';
import '@/styles/fruit.css';
import '@/styles/gameControls.css';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import useFruitGame from './fruit/useFruitGame';
import FruitReels from './fruit/FruitReels';
import FruitHud from './fruit/FruitHud';
import GameBetBar from './controls/GameBetBar';
import GameSpinButton from './controls/GameSpinButton';
import GameHelpSheet from './help/GameHelpSheet';
import GameTurnBadge from './controls/GameTurnBadge';
import FruitWinOverlay from './fruit/FruitWinOverlay';
import { WIN_CARD_THRESHOLD } from '@/components/games/shared/winCard';
import { FRUIT_LINES, formatCoins } from './fruit/fruitConfig';

const WIN_FLASH_MS = 2400;

/** MEYVE: altın çerçeveli premium meyve oyunu. Semboller ekranın her yerinde öder. */
export default function FruitGame({ onExit, onBack }) {
  const game = useFruitGame();
  const [coinOpen, setCoinOpen] = useState(false);
  const [flash, setFlash] = useState(0);
  const [prize, setPrize] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  // Kazanç yazısının kapanma sayacı: yeni tur başlasa da çalışmaya devam eder.
  const flashTimer = useRef(null);
  const ready = game.status === 'ready';

  // Tur sonucu: büyük kazançta kutlama ekranı, küçük kazançta kısa parıltı.
  useEffect(() => {
    window.clearTimeout(flashTimer.current);
    if (!game.spins) return undefined;
    // Çevirme hakkı sürerken ara kutlama yapılmaz; sonuç tur bitince gösterilir.
    if (game.sessionSpins > 0) return undefined;
    if (game.win >= WIN_CARD_THRESHOLD) {
      setPrize({ amount: game.win });
      return undefined;
    }
    // Kazanç yoksa yazı hemen silinir; varsa kısa süre görünüp kendiliğinden kapanır.
    setFlash(game.win > 0 ? game.win : 0);
    if (game.win > 0) {
      flashTimer.current = window.setTimeout(() => setFlash(0), WIN_FLASH_MS);
    }
    return undefined;
  }, [game.spins]);

  // Oyun kapanırken bekleyen sayaç temizlenir.
  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  return (
    <div className="fruit-sky relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <span aria-hidden="true" className="fruit-rays" />

      <header className="relative z-10 flex shrink-0 items-center gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="gctl-pill gctl-icon">
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
          onClick={() => setHelpOpen(true)}
          aria-label="Nasıl oynanır"
          className="gctl-pill gctl-icon"
        >
          <HelpCircle className="h-5 w-5" />
        </button>

      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center gap-1 px-0 py-1">
        {/* Izgara ekranın kalan tüm alanını kaplar: kartlar olabildiğince büyük durur. */}
        <div className="flex min-h-0 w-full flex-1 items-center justify-center">
          <div className="fruit-frame flex aspect-square max-h-full w-full max-w-[46rem] p-1 sm:p-2">
            <FruitReels
              spinning={game.spinning}
              stopping={game.stopping}
              landing={game.landing}
              spinKey={game.spinKey}
              grid={game.grid}
              wins={game.wins}
              explode={game.explode}
            />
          </div>
        </div>

        <GameTurnBadge
          sessionSpins={game.sessionSpins}
          freeSpins={game.freeSpins}
          accent="border-[#f0c46a]/80 text-[#ffe9b8]"
        />

        <FruitHud
          coins={game.coins}
          bet={game.bet}
          lines={FRUIT_LINES}
          win={game.win}
          totalWon={game.totalWon}
          busy={game.spinning}
          onCoins={() => setCoinOpen(true)}
          onSession={game.buySession}
          sessionPrice={game.sessionPrice}
          sessionSpins={game.sessionSpins}
          sessionSize={game.sessionSize}
        />

        {game.status === 'loading' && <p className="text-[11px] font-bold text-[#ffe9b8]">Oyun yükleniyor...</p>}
      </main>

      <footer className="relative z-10 flex shrink-0 flex-col items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
        <div className="gctl-deck ref-deck">
          <GameBetBar
            bet={game.bet}
            lines={FRUIT_LINES}
            disabled={game.spinning}
            onStep={game.changeBet}
            onMax={game.maxBet}
            format={formatCoins}
          />
          <GameSpinButton
            spinning={game.spinning}
            disabled={!ready}
            auto={game.auto}
            icon={Play}
            onSpin={game.spin}
            onStop={game.stop}
            onAuto={game.toggleAuto}
          />
        </div>
      </footer>

      {flash > 0 && !game.spinning && !prize && game.sessionResult === null && (
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
      <GameHelpSheet game="fruit" open={helpOpen} onClose={() => setHelpOpen(false)} />

      <FruitWinOverlay open={!!prize} amount={prize?.amount || 0} onAccept={() => setPrize(null)} />

      {/* 15 çevirme hakkı bittiğinde biriken toplam kazanç onaya sunulur. */}
      <FruitWinOverlay
        open={game.sessionResult !== null}
        amount={game.sessionResult || 0}
        title="15 ÇEVİRME HAKKI BİTTİ"
        subtitle="TOPLAM KAZANÇ"
        action="KABUL ET"
        onAccept={game.clearSessionResult}
      />
    </div>
  );
}