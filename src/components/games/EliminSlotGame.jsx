import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, HelpCircle, Play, Volume2, VolumeX, X } from 'lucide-react';
import '@/styles/elimin.css';
import '@/styles/eliminExtras.css';
import '@/styles/gameControls.css';
import { Image } from '@/components/ui/image';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import EliminJackpotBar from './elimin/EliminJackpotBar';
import EliminGrid from './elimin/EliminGrid';
import EliminHud from './elimin/EliminHud';
import EliminRulesSheet from './elimin/EliminRulesSheet';
import EliminWinOverlay from './elimin/EliminWinOverlay';
import GameTurnBadge from './controls/GameTurnBadge';
import GameBetBar from './controls/GameBetBar';
import GameSpinButton from './controls/GameSpinButton';
import useEliminGame from './elimin/useEliminGame';
import useCountUp from './sekerli/useCountUp';
import { warmSymbolTiles } from '@/lib/symbolTile';
import { ELIMIN_BACKDROP, ELIMIN_EMBLEM, ELIMIN_EMBLEM_SIZE } from './elimin/eliminAssets';
import { DICE_MIN, ELIMIN_SYMBOLS, LINES, SYMBOL_IDS, formatCoins } from './elimin/eliminConfig';

const WIN_FLASH_MS = 2200;

/**
 * ELİMİNSLOT: 6 sütun x 5 satır kare kart meyve slotu. Aynı meyveden 8 ve üzeri öder.
 * Ekran Şekerli Meyve'nin tasarımını birebir kullanır; nesneler bu oyunun kendi kartlarıdır.
 */
export default function EliminSlotGame({ onExit, onBack }) {
  const game = useEliminGame();
  const [coinOpen, setCoinOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [flash, setFlash] = useState(0);
  const [prize, setPrize] = useState(null);
  // Kazanç yazısının kapanma sayacı: yeni tur başlasa da çalışmaya devam eder.
  const flashTimer = useRef(null);
  const shownWin = useCountUp(game.win, 420);
  const ready = game.status === 'ready';

  // Sandık barı dolduğunda sandığa basılır: tutar bakiyeye eklenir, kutlama ekranı açılır.
  const handleCollect = async () => {
    const amount = await game.collectChest();
    if (amount > 0) setPrize({ amount, title: 'SANDIK DOLDU!', subtitle: 'JACKPOT BAKİYENE EKLENDİ' });
  };

  // Tur sonucu: büyük kazançta kutlama ekranı, küçük kazançta ızgaranın ortasında parıltı.
  useEffect(() => {
    window.clearTimeout(flashTimer.current);
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
    // Kazanç yoksa yazı hemen silinir; varsa kısa süre görünüp kendiliğinden kapanır.
    setFlash(game.win > 0 ? game.win : 0);
    if (game.win > 0) {
      flashTimer.current = window.setTimeout(() => setFlash(0), WIN_FLASH_MS);
    }
    return undefined;
  }, [game.spins]);

  // Semboller oyun açılırken bir kez işlenir: makara dönmeye başladığında hepsi hazır olur.
  useEffect(() => {
    warmSymbolTiles(SYMBOL_IDS.map((id) => ELIMIN_SYMBOLS[id].art));
  }, []);

  // Oyun kapanırken bekleyen sayaç temizlenir.
  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  return (
    <div className="el-sky">
      <div className="el-backdrop" aria-hidden="true">
        <Image src={ELIMIN_BACKDROP} alt="" className="h-full w-full" fittingType="fill" quality={70} />
      </div>
      <span className="el-aurora" aria-hidden="true" />

      <header className="el-head">
        <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="gctl-pill gctl-icon">
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="el-brand">
          <Image
            src={ELIMIN_EMBLEM}
            alt=""
            aria-hidden="true"
            className="el-logo"
            fittingType="fill"
            originWidth={ELIMIN_EMBLEM_SIZE}
            originHeight={ELIMIN_EMBLEM_SIZE}
            quality={80}
          />
          <span className="el-brand-text">
            <p className="el-title">ELİMİNSLOT</p>
            <p className="el-tagline">MEYVE SLOTU · {LINES} SATIR</p>
          </span>
        </div>

        <button type="button" onClick={() => setHelpOpen(true)} aria-label="Nasıl oynanır" className="gctl-pill gctl-icon">
          <HelpCircle className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={game.toggleSound}
          aria-label={game.sound ? 'Sesi kapat' : 'Sesi aç'}
          className={`gctl-pill gctl-icon ${game.sound ? 'gctl-pill-on' : ''}`}
        >
          {game.sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
        <button type="button" onClick={onExit} aria-label="Oyunu kapat" className="gctl-pill gctl-icon el-close-pill">
          <X className="h-5 w-5" />
        </button>
      </header>

      <main className="el-main">
        {/* Ortada jackpot, sağda sandık ve oyuncu rozeti. */}
        <EliminJackpotBar
          jackpot={game.jackpot}
          chests={game.chests}
          chestValue={game.chestValue}
          bet={game.bet}
          busy={game.spinning}
          onCollect={handleCollect}
        />

        <div className="el-stage">
          <div className={`el-frame ${game.spinning ? 'el-frame-live' : ''}`}>
            <span className="el-frame-shine" aria-hidden="true" />
            <div className="el-frame-inner">
              <EliminGrid
                spinning={game.spinning}
                stopping={game.stopping}
                landing={game.landing}
                spinKey={game.spinKey}
                grid={game.grid}
                wins={game.wins}
                explode={game.explode}
              />
              {/* Tur kazancı ızgaranın ortasında belirir. */}
              {flash > 0 && !game.spinning && !prize && <p key={flash} className="el-center-win">KAZANÇ {formatCoins(flash)}</p>}
            </div>
          </div>
        </div>

        {/* Tur durumu: çevirme hakkı ve tavuktan gelen bedava turlar görünür. */}
        <div className="el-turn-slot">
          <GameTurnBadge
            sessionSpins={game.sessionSpins}
            freeSpins={game.freeSpins}
            accent="border-[#ffd21f]/80 text-[#ffe9b8]"
          />
        </div>

        <EliminHud
          coins={game.coins}
          bet={game.bet}
          win={shownWin}
          totalWon={game.totalWon}
          busy={game.spinning}
          onCoins={() => setCoinOpen(true)}
          onSession={game.buySession}
          sessionPrice={game.sessionPrice}
          sessionSpins={game.sessionSpins}
          sessionSize={game.sessionSize}
        />

        {game.status === 'loading' && <p className="el-note">Oyun yükleniyor...</p>}
        {game.status === 'error' && <p className="el-note el-note-alert">Bağlantı kurulamadı, tekrar deniyorum...</p>}
        {game.message && <p className="el-note el-note-alert">{game.message}</p>}
      </main>

      <footer className="el-foot">
        <div className="gctl-deck ref-deck">
          <GameBetBar
            bet={game.bet}
            lines={LINES}
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

      {/* 15 çevirme hakkı bittiğinde biriken toplam kazanç onaya sunulur. */}
      <EliminWinOverlay
        open={game.sessionResult !== null}
        title="15 ÇEVİRME HAKKI BİTTİ"
        subtitle="TOPLAM KAZANÇ"
        amount={game.sessionResult || 0}
        action="KABUL ET"
        onAccept={game.clearSessionResult}
      />
    </div>
  );
}