import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, HelpCircle, Play, X } from 'lucide-react';
import '@/styles/seker.css';
import '@/styles/gameControls.css';
import GameHelpSheet from './help/GameHelpSheet';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import { Image } from '@/components/ui/image';
import useSekerGame from './seker/useSekerGame';
import SekerGrid from './seker/SekerGrid';
import SekerHud from './seker/SekerHud';
import GameBetBar from './controls/GameBetBar';
import GameSpinButton from './controls/GameSpinButton';
import GameTurnBadge from './controls/GameTurnBadge';
import SekerWinOverlay from './seker/SekerWinOverlay';
import { SEKER_LOGO } from './seker/sekerAssets';
import { SEKER_LINES, formatCoins } from './seker/sekerConfig';

const WIN_FLASH_MS = 2400;

/** ŞEKER: altın çerçeveli şeker oyunu. Aynı şekerden 10 ve üzeri gelince öder. */
export default function SekerGame({ onExit, onBack }) {
  const game = useSekerGame();
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
    if (game.bigWin > 0) {
      setPrize({ amount: game.bigWin });
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
    <div className="seker-sky relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <span aria-hidden="true" className="seker-rays" />

      <header className="relative z-10 flex shrink-0 items-center gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="gctl-pill gctl-icon">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <Image src={SEKER_LOGO} alt="" aria-hidden="true" className="seker-logo" fittingType="fill" quality={80} />
          <span className="min-w-0 text-left">
            <p className="seker-title text-lg leading-none">ŞEKER</p>
            <p className="mt-0.5 text-[9px] font-black tracking-[0.14em] text-[#ffe0a8]/75">
              AYNI ŞEKERDEN 10+ ÖDER
            </p>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          aria-label="Nasıl oynanır"
          className="gctl-pill gctl-icon"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onExit}
          aria-label="Oyunu kapat"
          className="gctl-pill gctl-icon ring-1 ring-[#f0c46a]/50"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center gap-2 px-2 py-2">
        {/* Izgara ekranın kalan tüm alanını kaplar: şekerler olabildiğince büyük durur. */}
        <div className="flex min-h-0 w-full flex-1 items-center justify-center">
          <div className="seker-frame flex aspect-square max-h-full w-full max-w-[30rem] p-2 sm:p-3">
            <SekerGrid
              spinning={game.spinning}
              stopping={game.stopping}
              landing={game.landing}
              spinKey={game.spinKey}
              grid={game.grid}
              wins={game.wins}
            />
          </div>
        </div>

        <GameTurnBadge
          sessionSpins={game.sessionSpins}
          freeSpins={game.freeSpins}
          accent="border-[#ff7ac6]/80 text-[#ffd9ef]"
        />

        <SekerHud
          coins={game.coins}
          bet={game.bet}
          lines={SEKER_LINES}
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
        <div className="gctl-deck">
          <GameBetBar
            bet={game.bet}
            lines={SEKER_LINES}
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
          className="seker-float-win pointer-events-none absolute left-1/2 top-[46%] z-20 rounded-full border border-[#ffe9b8]/80 bg-black/75 px-4 py-1.5 font-mono text-base font-black text-[#ffd35c]"
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
      <GameHelpSheet game="seker" open={helpOpen} onClose={() => setHelpOpen(false)} />

      <SekerWinOverlay open={!!prize} amount={prize?.amount || 0} onAccept={() => setPrize(null)} />

      {/* 15 çevirme hakkı bittiğinde biriken toplam kazanç onaya sunulur. */}
      <SekerWinOverlay
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