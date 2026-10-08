import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, HelpCircle, X, Zap } from 'lucide-react';
import '@/styles/dede.css';
import '@/styles/gameControls.css';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import { Image } from '@/components/ui/image';
import useCutoutImage from '@/lib/cutoutImage';
import useDedeGame from './dede/useDedeGame';
import DedeReels from './dede/DedeReels';
import DedeHud from './dede/DedeHud';
import GameHelpSheet from './help/GameHelpSheet';
import GameBetBar from './controls/GameBetBar';
import GameSpinButton from './controls/GameSpinButton';
import GameTurnBadge from './controls/GameTurnBadge';
import DedeWinOverlay from './dede/DedeWinOverlay';
import DedeMultiplierBar from './dede/DedeMultiplierBar';
import DedeOrbMerge from './dede/DedeOrbMerge';
import { DEDE_DEITY } from './dede/dedeAssets';
import { DEDE_LINES, formatCoins } from './dede/dedeConfig';

const WIN_FLASH_MS = 2400;

/** DEDE: Olympos'un çarpan küreleri. 6x5 ızgarada semboller patlar, yenileri düşer. */
export default function DedeGame({ onExit, onBack }) {
  const game = useDedeGame();
  const [coinOpen, setCoinOpen] = useState(false);
  const [flash, setFlash] = useState(0);
  const [prize, setPrize] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  // Kazanç yazısının kapanma sayacı: yeni tur başlasa da çalışmaya devam eder.
  const flashTimer = useRef(null);
  const ready = game.status === 'ready';
  // Siyah zemini tarayıcıda gerçek zamanlı kesilmiş dede karakteri.
  const deity = useCutoutImage(DEDE_DEITY);

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
            ÇARPAN KÜRELERİ · 4+ SCATTER 15 ÇEVİRME HAKKI
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
            <div className="relative flex min-h-0 w-full">
              <DedeReels
                rolling={game.rolling}
                landing={game.landing}
                spinKey={game.spinKey}
                grid={game.grid}
                wins={game.wins}
                orbs={game.orbs}
                explode={game.explode}
              />
              {/* İnen çarpan küreleri ızgaranın ortasında birleşip patlar. */}
              <DedeOrbMerge
                orbs={game.orbs}
                multiplier={game.multiplier}
                grid={game.grid}
                explode={game.explode}
              />
            </div>
          </div>
        </div>

        <GameTurnBadge sessionSpins={game.sessionSpins} accent="border-[#ffd35c]/80 text-[#ffe9a8]" />

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
        <div className="gctl-deck">
          <GameBetBar
            bet={game.bet}
            lines={DEDE_LINES}
            disabled={game.spinning || game.intro}
            onStep={game.changeBet}
            onMax={game.maxBet}
            format={formatCoins}
          />
          <GameSpinButton
            spinning={game.spinning}
            disabled={!ready || game.intro}
            auto={game.auto}
            icon={Zap}
            onSpin={game.spin}
            onStop={game.stop}
            onAuto={game.toggleAuto}
          />
        </div>
      </footer>

      {flash > 0 && !game.spinning && !prize && game.sessionResult === null && (
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
      <GameHelpSheet game="dede" open={helpOpen} onClose={() => setHelpOpen(false)} />

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

      {/* 4, 5 ya da 6 skatter gelince 15 çevirme hakkı bedelsiz verilir. */}
      <DedeWinOverlay
        open={!!game.sessionBonus}
        amount={game.sessionBonus?.spins || 0}
        title="15 ÇEVRİME HAKKI"
        subtitle="4 · 5 · 6 SKATTER · ÜCRETSİZ"
        action="BAŞLA"
        onAccept={game.clearSessionBonus}
      />

      {/* Çevirme hakkı sürerken gelen 4 skatter: ek 15 tur bedelsiz eklenir. */}
      <DedeWinOverlay
        open={game.retrigger > 0}
        amount={game.retrigger}
        title={`+${game.retrigger} ÇEVRİME HAKKI`}
        subtitle="4 SKATTER · ÜCRETSİZ"
        action="DEVAM"
        onAccept={game.clearRetrigger}
      />
    </div>
  );
}