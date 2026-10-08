import React, { useEffect, useState } from 'react';
import { ChevronLeft, X, Zap } from 'lucide-react';
import '@/styles/dede.css';
import '@/styles/gameControls.css';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import { Image } from '@/components/ui/image';
import useCutoutImage from '@/lib/cutoutImage';
import useDedeGame from './dede/useDedeGame';
import DedeReels from './dede/DedeReels';
import DedeHud from './dede/DedeHud';
import GameBetBar from './controls/GameBetBar';
import GameSpinButton from './controls/GameSpinButton';
import GameTurnBadge from './controls/GameTurnBadge';
import DedeWinOverlay from './dede/DedeWinOverlay';
import DedeMultiplierBar from './dede/DedeMultiplierBar';
import { DEDE_DEITY } from './dede/dedeAssets';
import { DEDE_LINES, formatCoins } from './dede/dedeConfig';

const WIN_FLASH_MS = 2400;

/** DEDE: Olympos'un çarpan küreleri. 6x5 ızgarada semboller patlar, yenileri düşer. */
export default function DedeGame({ onExit, onBack }) {
  const game = useDedeGame();
  const [coinOpen, setCoinOpen] = useState(false);
  const [flash, setFlash] = useState(0);
  const [prize, setPrize] = useState(null);
  const ready = game.status === 'ready';
  // Siyah zemini tarayıcıda gerçek zamanlı kesilmiş dede karakteri.
  const deity = useCutoutImage(DEDE_DEITY);

  // Tur sonucu: büyük kazançta kutlama ekranı, küçük kazançta kısa parıltı.
  useEffect(() => {
    if (!game.spins) return undefined;
    // Çevirme hakkı sürerken ara kutlama yapılmaz; sonuç tur bitince gösterilir.
    if (game.sessionSpins > 0) return undefined;
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
    <div className="dede-sky relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <span aria-hidden="true" className="dede-rays" />
      {deity && (
        <Image
          src={deity}
          alt=""
          aria-hidden="true"
          fittingType="fit"
          originWidth={1024}
          originHeight={1024}
          className="dede-deity"
        />
      )}

      <header className="relative z-10 flex shrink-0 items-center gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="gctl-pill gctl-icon">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="dede-title text-lg">DEDE</p>
          <p className="text-[9px] font-black tracking-[0.14em] text-[#ffe9a8]/80">
            ÇARPAN KÜRELERİ · 4+ DEDE BONUS ÖDER
          </p>
        </div>
        <button
          type="button"
          onClick={onExit}
          aria-label="Oyunu kapat"
          className="gctl-pill gctl-icon ring-1 ring-[#ffd35c]/50"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center gap-2 px-2 py-2">
        {/* Izgara ekranın kalan tüm alanını kaplar: madalyonlar olabildiğince büyük durur. */}
        <div className="flex min-h-0 w-full flex-1 items-center justify-center">
          <div className="dede-frame flex aspect-[6/5] max-h-full w-full max-w-[34rem] p-2 sm:p-3">
            <DedeReels
              rolling={game.rolling}
              grid={game.grid}
              wins={game.wins}
              orbs={game.orbs}
              explode={game.explode}
            />
          </div>
        </div>

        <GameTurnBadge
          sessionSpins={game.sessionSpins}
          freeSpins={game.freeSpins}
          accent="border-[#ffd35c]/80 text-[#ffe9a8]"
        />

        <DedeHud
          coins={game.coins}
          bet={game.bet}
          lines={DEDE_LINES}
          win={game.win}
          totalWon={game.totalWon}
          busy={game.spinning}
          onCoins={() => setCoinOpen(true)}
          onSession={game.buySession}
          sessionPrice={game.sessionPrice}
          sessionSpins={game.sessionSpins}
          sessionSize={game.sessionSize}
        />

        {game.status === 'loading' && <p className="text-[11px] font-bold text-[#ffe9a8]">Oyun yükleniyor...</p>}
      </main>

      <footer className="relative z-10 flex shrink-0 flex-col items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
        {/* Biriken çarpan alt tarafta sabit durur; inen küreler buraya düşer. */}
        <DedeMultiplierBar multiplier={game.multiplier} orbs={game.orbs} />
        <GameBetBar
          bet={game.bet}
          lines={DEDE_LINES}
          disabled={game.spinning}
          onStep={game.changeBet}
          onMax={game.maxBet}
          format={formatCoins}
        />
        <GameSpinButton
          spinning={game.spinning}
          disabled={!ready}
          auto={game.auto}
          icon={Zap}
          onSpin={game.spin}
          onStop={game.stop}
          onAuto={game.toggleAuto}
        />
      </footer>

      {game.freeTrigger && !prize && game.sessionResult === null && (
        <p className="dede-float-win pointer-events-none absolute left-1/2 top-[36%] z-20 flex w-max items-center gap-1.5 rounded-full border border-[#ffe9a8] bg-black/75 px-4 py-1.5 text-sm font-black text-[#ffd35c]">
          <Zap className="h-4 w-4" /> {game.freeTrigger}
        </p>
      )}

      {flash > 0 && !prize && game.sessionResult === null && (
        <p
          key={flash}
          className="dede-float-win pointer-events-none absolute left-1/2 top-[48%] z-20 w-max rounded-full border border-[#ffe9a8]/80 bg-black/75 px-4 py-1.5 font-mono text-base font-black text-[#ffd35c]"
        >
          KAZANÇ {formatCoins(flash)}
        </p>
      )}

      {game.message && !coinOpen && !prize && (
        <p className="absolute left-1/2 top-[58%] z-20 w-max max-w-[90%] -translate-x-1/2 rounded-full bg-black/75 px-3 py-1.5 text-center text-[11px] font-bold text-[#ffd35c]">
          {game.message}
        </p>
      )}

      {/* Coin bakiyesine dokununca uygulamanın coin mağazası açılır. */}
      <CoinPurchasePanel open={coinOpen} coins={game.coins} onBack={() => setCoinOpen(false)} />

      <DedeWinOverlay open={!!prize} amount={prize?.amount || 0} onAccept={() => setPrize(null)} />

      {/* 15 çevirme hakkı bittiğinde biriken toplam kazanç onaya sunulur. */}
      <DedeWinOverlay
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