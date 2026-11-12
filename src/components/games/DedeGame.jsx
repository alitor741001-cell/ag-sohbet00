import React, { useEffect, useRef, useState } from 'react';

import '@/styles/dede.css';
import '@/styles/gameControls.css';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import DedeZeusHeader from '@/components/games/dede/DedeZeusHeader';
import GameLeaderSheet from '@/components/games/leaders/GameLeaderSheet';
import useGameLeaders from '@/components/games/leaders/useGameLeaders';
import DedeStorm from '@/components/games/dede/DedeStorm';
import useDedeVisibleOrbs from '@/components/games/dede/useDedeVisibleOrbs';
import '@/components/games/dede/dedeWizard.css';
import useDedeGame from './dede/useDedeGame';
import DedeReels from './dede/DedeReels';
import DedeControlDeck from '@/components/games/dede/DedeControlDeck';
import GameHelpSheet from './help/GameHelpSheet';

import DedeWinOverlay from './dede/DedeWinOverlay';
import { WIN_CARD_THRESHOLD } from '@/components/games/shared/winCard';

import DedeOrbMerge from './dede/DedeOrbMerge';
import DedeMultiplierCircle from './dede/DedeMultiplierCircle';
import useDedeTray from './dede/useDedeTray';

import { formatCoins } from './dede/dedeConfig';

const WIN_FLASH_MS = 2400;

/** DEDE: Olympos'un çarpan küreleri. 6x5 ızgarada semboller patlar, yenileri düşer. */
export default function DedeGame({ onExit, onBack, roomId }) {
  const game = useDedeGame();
  // Sesli oda içinde oyun yarım panelde açılır: üst bar kısalır, çerçeve ekranı kaplar.
  const inRoom = !!roomId;
  const strikeOrbs = useDedeVisibleOrbs(game.grid, game.rolling);
  // Tur boyunca inen ve patlayan çarpanlar sağ üstteki çemberde birikir.
  const tray = useDedeTray(game);
  // Kazanan nesnelerle aynı dizilimde çarpan varsa mavi; yalnızca çarpan inmesi kırmızı.
  const hasExplodingSymbols = (game.wins || []).some(win => !win.scatter && win.cells?.length > 0);
  const strikeTone = hasExplodingSymbols && (strikeOrbs.length > 0 || (game.orbs || []).length > 0) ? 'blue' : 'red';
  const [coinOpen, setCoinOpen] = useState(false);
  const [flash, setFlash] = useState(0);
  const [prize, setPrize] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [leadersOpen, setLeadersOpen] = useState(false);
  const { leaders, top: leader, reload: reloadLeaders } = useGameLeaders('dede');
  // Kazanç yazısının kapanma sayacı: yeni tur başlasa da çalışmaya devam eder.
  const flashTimer = useRef(null);



  // Tur sonucu: büyük kazançta kutlama ekranı, küçük kazançta kısa parıltı.
  useEffect(() => {
    window.clearTimeout(flashTimer.current);
    if (!game.spins) return undefined;
    // Çevirme hakkı sürerken ara kutlama yapılmaz; sonuç tur bitince gösterilir.
    if (game.sessionSpins > 0 || game.sessionResult !== null) return undefined;
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
    <div className="dede-sky relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <span aria-hidden="true" className="dede-rays" />
      <DedeZeusHeader
        coins={game.coins}
        leader={leader}
        compact={inRoom}
        onCoins={() => setCoinOpen(true)}
        onLeaders={() => { reloadLeaders(); setLeadersOpen(true); }}
        onHelp={() => setHelpOpen(true)}
      />

      {/* Izgara üst görselin alt kısmına doğru yükselir: görselin altı çerçevenin arkasında kalır. */}
      <main className={`relative z-10 flex min-h-0 flex-1 flex-col items-center gap-1 px-0 pb-1 ${inRoom ? '-mt-[5vw]' : '-mt-[22vw] sm:-mt-28'}`}>
        <div className="flex min-h-0 w-full flex-1 items-stretch justify-center">
          {/* Çerçeve yanlara taşacak kadar geniş: ekran kenarına kadar uzanır. */}
          <div className="dede-frame -mx-1 flex h-full w-[calc(100%+0.5rem)] max-w-[56rem] p-0.5 sm:p-1.5">
            <div className="relative flex min-h-0 w-full">
              {/* Kalan çevirme hakkı: ızgaranın üstünde sabit durur, çevirme sürerken de görünür. */}
              {game.sessionSpins > 0 && (
                <p
                  key={game.sessionSpins}
                  className="pointer-events-none absolute left-1/2 top-1 z-30 w-max -translate-x-1/2 whitespace-nowrap rounded-full border border-[#ffe9a8]/80 bg-black/75 px-3 py-1 text-[10px] font-black tracking-[0.12em] text-[#ffd35c] shadow-[0_0_14px_-2px_rgba(255,200,80,0.8)]"
                >
                  KALAN <span className="font-mono text-sm text-white">{game.sessionSpins}</span> ÇEVİRME
                </p>
              )}
              <DedeReels
                rolling={game.rolling}
                landing={game.landing}
                spinKey={game.spinKey}
                grid={game.grid}
                wins={game.wins}
                orbs={game.orbs}
                strikeTone={strikeTone}
                explode={game.explode}
              />
              {/* İnen çarpan küreleri ızgaranın ortasında birleşip patlar. */}
              <DedeOrbMerge
                orbs={game.orbs}
                multiplier={game.multiplier}
                grid={game.grid}
                explode={game.explode}
              />
              <DedeStorm orbs={strikeOrbs} spinKey={game.spinKey} rolling={game.rolling} grid={game.grid} tone={strikeTone} />
              {/* Sağ üst çember: biriken çarpan tek yerde toplanır. */}
              <span className="pointer-events-none absolute right-1 top-1 z-30">
                <DedeMultiplierCircle multiplier={game.multiplier} orbs={tray.orbs} compact />
              </span>
            </div>
          </div>
        </div>



        {game.status === 'loading' && <p className="text-[11px] font-bold text-[#ffe9a8]">Oyun yükleniyor...</p>}
      </main>

      <DedeControlDeck game={game} onCoins={() => setCoinOpen(true)} />

      {/* Kazanç tutarı: tur bitince kaybolmaz, sonraki çevirmeye kadar görünür kalır. */}
      {(flash || game.win) > 0 && !game.spinning && !prize && game.sessionResult === null && (
        <p
          key={flash || game.win}
          className="dede-float-win pointer-events-none absolute left-1/2 top-[48%] z-20 w-max rounded-full border border-[#ffe9a8]/80 bg-black/75 px-4 py-1.5 font-mono text-base font-black text-[#ffd35c]"
        >
          WIN {formatCoins(flash || game.win)}
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
      <GameLeaderSheet open={leadersOpen} title="Dede" leaders={leaders} onClose={() => setLeadersOpen(false)} />

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