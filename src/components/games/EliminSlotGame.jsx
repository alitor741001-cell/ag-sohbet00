import React, { useEffect, useState } from 'react';
import '@/styles/elimin.css';
import '@/styles/eliminExtras.css';
import { Image } from '@/components/ui/image';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import EliminTopBar from './elimin/EliminTopBar';
import EliminJackpotBar from './elimin/EliminJackpotBar';
import EliminGrid from './elimin/EliminGrid';
import EliminFooter from './elimin/EliminFooter';
import EliminRulesSheet from './elimin/EliminRulesSheet';
import EliminWinOverlay from './elimin/EliminWinOverlay';
import useEliminGame from './elimin/useEliminGame';
import useCountUp from './sekerli/useCountUp';
import { ELIMIN_BACKDROP, ELIMIN_EMBLEM, ELIMIN_EMBLEM_SIZE } from './elimin/eliminAssets';
import { DICE_MIN, LINES, formatCoins } from './elimin/eliminConfig';

const WIN_FLASH_MS = 2200;

/** ELİMİNSLOT: 6 sütun x 5 satır kare kart meyve slotu. Aynı meyveden 8 ve üzeri öder. */
export default function EliminSlotGame({ onExit, onBack }) {
  const game = useEliminGame();
  const [coinOpen, setCoinOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [flash, setFlash] = useState(0);
  const [prize, setPrize] = useState(null);
  const shownWin = useCountUp(game.win, 420);
  const ready = game.status === 'ready';

  // Tur sonucu: büyük kazançta kutlama ekranı, küçük kazançta kısa parıltı.
  useEffect(() => {
    if (!game.spins) return undefined;
    // Zar dörtlüsünde jackpot patlar: kutlama ekranı jackpotu öne çıkarır.
    if (game.jackpotWin > 0) {
      setPrize({
        amount: game.jackpotWin,
        title: 'JACKPOT PATLADI!',
        subtitle: `${DICE_MIN} ZAR · JACKPOTUN YARISI`,
      });
      return undefined;
    }
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
    <div className="el-sky">
      <div className="el-backdrop" aria-hidden="true">
        <Image src={ELIMIN_BACKDROP} alt="" className="h-full w-full" fittingType="fill" quality={70} />
      </div>
      <span className="el-veil" aria-hidden="true" />

      <EliminTopBar
        coins={game.coins}
        sound={game.sound}
        onSound={game.toggleSound}
        onCoins={() => setCoinOpen(true)}
        onHelp={() => setHelpOpen(true)}
        onBack={onBack}
        onExit={onExit}
      />

      <div className="el-body">
        {/* Marka paneli: oyunun kendi logosu ve adı. */}
        <section className="el-hero">
          <Image
            src={ELIMIN_EMBLEM}
            alt=""
            aria-hidden="true"
            className="el-emblem"
            fittingType="fit"
            originWidth={ELIMIN_EMBLEM_SIZE}
            originHeight={ELIMIN_EMBLEM_SIZE}
            quality={86}
          />
          <div className="el-hero-text">
            <p className="el-wordmark">ELİMİNSLOT</p>
            <p className="el-hero-tag">MEYVE SLOTU · {LINES} SATIR</p>
          </div>
          {game.freeSpins > 0 && (
            <span className="el-free-chip">BEDAVA ÇEVİRME {game.freeSpins}</span>
          )}
        </section>

        <EliminJackpotBar jackpot={game.jackpot} chests={game.chests} bet={game.bet} />

        {/* Izgara ekranın kalan tüm alanını kaplar; kartlar kendi karesinde durur. */}
        <div className="el-board-wrap">
          <EliminGrid
            spinning={game.spinning}
            stopping={game.stopping}
            landing={game.landing}
            spinKey={game.spinKey}
            grid={game.grid}
            wins={game.wins}
          />
        </div>

        {game.status === 'loading' && <p className="el-note">Oyun yükleniyor...</p>}
        {game.status === 'error' && <p className="el-note el-note-alert">Bağlantı kurulamadı, tekrar deniyorum...</p>}
        {game.message && <p className="el-note el-note-alert">{game.message}</p>}
      </div>

      {flash > 0 && !prize && (
        <p key={flash} className="el-float-win">KAZANÇ {formatCoins(flash)}</p>
      )}

      <EliminFooter
        win={shownWin}
        coins={game.coins}
        totalWon={game.totalWon}
        bet={game.bet}
        spinning={game.spinning}
        ready={ready}
        auto={game.auto}
        onStep={game.changeBet}
        onAuto={game.toggleAuto}
        onSpin={game.spin}
        onStop={game.stop}
      />

      {/* Coin bakiyesine dokununca uygulamanın coin mağazası açılır. */}
      <CoinPurchasePanel open={coinOpen} coins={game.coins} onBack={() => setCoinOpen(false)} />
      <EliminRulesSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
      <EliminWinOverlay
        open={!!prize}
        amount={prize?.amount || 0}
        title={prize?.title}
        subtitle={prize?.subtitle}
        onAccept={() => setPrize(null)}
      />
    </div>
  );
}